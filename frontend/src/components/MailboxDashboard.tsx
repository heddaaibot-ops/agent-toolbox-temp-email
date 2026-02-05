import { useState, useEffect } from 'react';
import { Mail, Copy, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { web3Service } from '../services/web3';
import type { Mailbox, EmailMessage } from '../types';
import { EmailList } from './EmailList';
import { CountdownTimer } from './CountdownTimer';

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
  const [expiresAtTimestamp, setExpiresAtTimestamp] = useState<number>(0);

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

      // Also get on-chain data for countdown timer
      try {
        const onChainData = await web3Service.getMailboxDetails(mailboxId);
        setExpiresAtTimestamp(onChainData.expiresAt);
      } catch (error) {
        console.error('Failed to load on-chain data:', error);
        // Fallback to backend data
        const expiresAt = new Date(data.expiresAt).getTime() / 1000;
        setExpiresAtTimestamp(Math.floor(expiresAt));
      }
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-glass-purple-400" size={32} />
          <span className="ml-3 text-white/60">Loading mailbox...</span>
        </div>
      </div>
    );
  }

  if (error || !mailbox) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <XCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
          <p className="text-white/60 mb-6">{error || 'Mailbox not found'}</p>
          <button onClick={onBack} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-xl backdrop-blur-sm transition-all duration-200">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleExpired = () => {
    // Reload mailbox when it expires
    loadMailbox();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Countdown Timer */}
      {expiresAtTimestamp > 0 && (
        <CountdownTimer
          expiresAt={expiresAtTimestamp}
          mailboxId={mailboxId}
          onExpired={handleExpired}
        />
      )}

      {/* Mailbox Info Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-glass-purple-500/20 backdrop-blur-sm border border-glass-purple-400/30 p-3 rounded-xl">
              <Mail className="text-glass-purple-300" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Mailbox</h2>
              <p className="text-white/60">ID: {mailboxId}</p>
            </div>
          </div>
          <button onClick={onBack} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-xl backdrop-blur-sm transition-all duration-200">
            ← Back
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mailbox.email}
                readOnly
                className="w-full px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl focus:outline-none focus:bg-white/10 focus:border-glass-purple-400/50 text-white placeholder:text-white/40 flex-1 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(mailbox.email)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 p-2"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle size={20} className="text-glass-emerald-400" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Status
            </label>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border ${
                  mailbox.active
                    ? 'bg-glass-emerald-500/20 border-glass-emerald-400/30 text-glass-emerald-300'
                    : 'bg-red-500/20 border-red-400/30 text-red-300'
                }`}
              >
                {mailbox.active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {mailbox.active ? 'Active' : 'Expired'}
              </div>
              <div className="flex items-center gap-2 text-white">
                <Clock size={16} />
                {getTimeRemaining()}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/50">Duration:</span>
            <span className="ml-2 font-semibold text-white">{mailbox.duration} hours</span>
          </div>
          <div>
            <span className="text-white/50">Payment:</span>
            <span className="ml-2 font-semibold text-white">{mailbox.paymentMethod}</span>
          </div>
          <div>
            <span className="text-white/50">Messages:</span>
            <span className="ml-2 font-semibold text-white">{messages.length}</span>
          </div>
        </div>
      </div>

      {/* Messages Section */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Messages</h3>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-gradient-to-r from-glass-purple-600 to-fuchsia-600 hover:shadow-glass-lg hover:scale-105 border border-white/20 text-white font-semibold py-2 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
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
