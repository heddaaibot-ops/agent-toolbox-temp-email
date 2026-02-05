import { useState, useEffect } from 'react';
import { Mail, Copy, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { Mailbox, EmailMessage } from '../types';
import { EmailList } from './EmailList';

interface MailboxDashboardProps {
  mailboxId: string;
  onBack: () => void;
}

export function MailboxDashboard({ mailboxId, onBack }: MailboxDashboardProps) {
  const [mailbox, setMailbox] = useState<Mailbox | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMailbox();
    loadMessages();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadMessages(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [mailboxId]);

  const loadMailbox = async () => {
    try {
      const data = await apiService.getMailbox(mailboxId);
      setMailbox(data);
    } catch (error: any) {
      console.error('Failed to load mailbox:', error);
      setError('Failed to load mailbox details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sync = false) => {
    try {
      const data = await apiService.getMessages(mailboxId, sync);
      setMessages(data);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const count = await apiService.syncMessages(mailboxId);
      await loadMessages();
      alert(`Synced ${count} new messages`);
    } catch (error: any) {
      console.error('Failed to sync:', error);
      alert('Failed to sync messages');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const getTimeRemaining = () => {
    if (!mailbox) return '';
    const now = new Date();
    const expires = new Date(mailbox.expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-primary-600" size={32} />
          <span className="ml-3 text-gray-600">Loading mailbox...</span>
        </div>
      </div>
    );
  }

  if (error || !mailbox) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center py-12">
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error || 'Mailbox not found'}</p>
          <button onClick={onBack} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mailbox Info Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Mail className="text-primary-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Mailbox</h2>
              <p className="text-gray-600">ID: {mailboxId}</p>
            </div>
          </div>
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mailbox.email}
                readOnly
                className="input flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(mailbox.email)}
                className="btn-secondary p-2"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  mailbox.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {mailbox.active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {mailbox.active ? 'Active' : 'Expired'}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock size={16} />
                {getTimeRemaining()}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-semibold">{mailbox.duration} hours</span>
          </div>
          <div>
            <span className="text-gray-600">Payment:</span>
            <span className="ml-2 font-semibold">{mailbox.paymentMethod}</span>
          </div>
          <div>
            <span className="text-gray-600">Messages:</span>
            <span className="ml-2 font-semibold">{messages.length}</span>
          </div>
        </div>
      </div>

      {/* Messages Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Messages</h3>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={16} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>

        <EmailList messages={messages} />
      </div>
    </div>
  );
}
