import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MailTMAccount {
  email: string;
  password: string;
  token?: string;
}

interface MailTMDomain {
  id: string;
  domain: string;
}

interface MailTMMessage {
  id: string;
  from: { address: string; name: string };
  to: Array<{ address: string; name: string }>;
  subject: string;
  intro: string;
  hasAttachments: boolean;
  size: number;
  seen: boolean;
  createdAt: string;
}

export class MailTMService {
  private client: ReturnType<typeof axios.create>;
  private baseUrl = 'https://api.mail.tm';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get available domains from mail.tm
   */
  async getAvailableDomains(): Promise<MailTMDomain[]> {
    try {
      const response = await this.client.get<{ 'hydra:member': MailTMDomain[] }>('/domains');
      return response.data['hydra:member'];
    } catch (error) {
      console.error('Error fetching domains:', error);
      throw new Error('Failed to fetch available domains');
    }
  }

  /**
   * Create a new temporary email account
   */
  async createAccount(): Promise<MailTMAccount> {
    try {
      // Get available domains
      const domains = await this.getAvailableDomains();
      if (!domains || domains.length === 0) {
        throw new Error('No available domains');
      }

      const domain = domains[0].domain;

      // Generate random username
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const username = `temp_${timestamp}_${randomStr}`;
      const email = `${username}@${domain}`;

      // Generate random password
      const password = Math.random().toString(36).substring(2, 18);

      // Create account
      await this.client.post('/accounts', {
        address: email,
        password: password,
      });

      console.log(`✅ Created mail.tm account: ${email}`);

      return { email, password };
    } catch (error: any) {
      console.error('Error creating account:', error.response?.data || error.message);
      throw new Error('Failed to create mail.tm account');
    }
  }

  /**
   * Login to get JWT token
   */
  async login(email: string, password: string): Promise<string> {
    try {
      const response = await this.client.post<{ token: string }>('/token', {
        address: email,
        password: password,
      });

      return response.data.token;
    } catch (error) {
      console.error('Error logging in:', error);
      throw new Error('Failed to login to mail.tm');
    }
  }

  /**
   * Get messages for an account
   */
  async getMessages(email: string, password: string): Promise<MailTMMessage[]> {
    try {
      // Login to get token
      const token = await this.login(email, password);

      // Get messages
      const response = await this.client.get<{ 'hydra:member': MailTMMessage[] }>('/messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data['hydra:member'];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Sync messages from mail.tm to database
   */
  async syncMessages(mailboxId: string): Promise<number> {
    try {
      // Get mailbox from database
      const mailbox = await prisma.mailbox.findUnique({
        where: { mailboxId },
      });

      if (!mailbox) {
        throw new Error('Mailbox not found');
      }

      // Fetch messages from mail.tm
      const messages = await this.getMessages(mailbox.email, mailbox.password);

      let syncedCount = 0;

      // Save new messages to database
      for (const msg of messages) {
        try {
          await prisma.message.upsert({
            where: { messageId: msg.id },
            update: {
              seen: msg.seen,
            },
            create: {
              messageId: msg.id,
              mailboxId: mailboxId,
              from: msg.from.address,
              to: msg.to[0]?.address || mailbox.email,
              subject: msg.subject,
              intro: msg.intro,
              hasAttachments: msg.hasAttachments,
              size: msg.size,
              seen: msg.seen,
              receivedAt: new Date(msg.createdAt),
            },
          });
          syncedCount++;
        } catch (error) {
          console.error(`Error saving message ${msg.id}:`, error);
        }
      }

      console.log(`✅ Synced ${syncedCount} messages for mailbox ${mailboxId}`);
      return syncedCount;
    } catch (error) {
      console.error('Error syncing messages:', error);
      throw error;
    }
  }

  /**
   * Check if mailbox is expired
   */
  isMailboxExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Delete expired mailboxes
   */
  async cleanupExpiredMailboxes(): Promise<number> {
    try {
      const result = await prisma.mailbox.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          active: true,
        },
        data: {
          active: false,
        },
      });

      console.log(`✅ Deactivated ${result.count} expired mailboxes`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired mailboxes:', error);
      throw error;
    }
  }
}

export default new MailTMService();
