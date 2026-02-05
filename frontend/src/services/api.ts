import axios from 'axios';
import { BACKEND_URL } from '../config/constants';
import type { Mailbox, EmailMessage, MailboxStatus } from '../types';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Get mailbox details
  getMailbox: async (mailboxId: string): Promise<Mailbox> => {
    const response = await api.get<{ success: boolean; data: Mailbox }>(
      `/api/mailbox/${mailboxId}`
    );
    return response.data.data;
  },

  // Get all messages for a mailbox
  getMessages: async (mailboxId: string, sync = false): Promise<EmailMessage[]> => {
    const response = await api.get<{ success: boolean; data: EmailMessage[] }>(
      `/api/mailbox/${mailboxId}/messages`,
      { params: { sync: sync ? 'true' : 'false' } }
    );
    return response.data.data;
  },

  // Manually sync messages
  syncMessages: async (mailboxId: string): Promise<number> => {
    const response = await api.post<{ success: boolean; data: { synced: number } }>(
      `/api/mailbox/${mailboxId}/sync`
    );
    return response.data.data.synced;
  },

  // Get mailbox status
  getStatus: async (mailboxId: string): Promise<MailboxStatus> => {
    const response = await api.get<{ success: boolean; data: MailboxStatus }>(
      `/api/mailbox/${mailboxId}/status`
    );
    return response.data.data;
  },

  // Get all mailboxes for a buyer
  getBuyerMailboxes: async (address: string): Promise<Mailbox[]> => {
    const response = await api.get<{ success: boolean; data: Mailbox[] }>(
      `/api/mailbox/buyer/${address}`
    );
    return response.data.data;
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await api.get('/health');
      return response.data.success;
    } catch {
      return false;
    }
  },
};
