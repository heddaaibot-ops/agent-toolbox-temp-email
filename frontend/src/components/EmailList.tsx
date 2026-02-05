import { useState } from 'react';
import { Mail, Inbox, Clock } from 'lucide-react';
import { EmailMessage } from '../types';

interface EmailListProps {
  messages: EmailMessage[];
}

export function EmailList({ messages }: EmailListProps) {
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
        <p className="text-gray-600">
          Messages sent to your temporary email will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          onClick={() => setSelectedMessage(message)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedMessage?.id === message.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900 truncate">{message.from}</span>
              </div>
              <div className="font-medium text-gray-900 mb-1 truncate">{message.subject}</div>
              <div className="text-sm text-gray-600 line-clamp-2">{message.intro}</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
              <Clock size={12} />
              {formatDate(message.receivedAt)}
            </div>
          </div>

          {/* Expanded view */}
          {selectedMessage?.id === message.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">From:</span>
                  <span className="ml-2 text-gray-900">{message.from}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Subject:</span>
                  <span className="ml-2 text-gray-900">{message.subject}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Received:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(message.receivedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.intro}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
