export interface Mailbox {
  id: string;
  mailboxId: string;
  email: string;
  buyer: string;
  expiresAt: string;
  duration: number;
  paymentMethod: string;
  active: boolean;
  createdAt: string;
  messages?: EmailMessage[];
}

export interface EmailMessage {
  id: string;
  mailboxId: string;
  messageId: string;
  from: string;
  subject: string;
  intro: string;
  receivedAt: string;
  seen: boolean;
}

export interface PurchaseParams {
  duration: number; // 1-24 hours
  paymentToken: 'USDC' | 'MON';
}

export interface MailboxStatus {
  active: boolean;
  expiresAt: string;
  timeRemaining: string;
}
