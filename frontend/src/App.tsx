import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { PurchaseMailbox } from './components/PurchaseMailbox';
import { MailboxDashboard } from './components/MailboxDashboard';
import { apiService } from './services/api';
import { web3Service } from './services/web3';
import { Mail, Sparkles } from 'lucide-react';

type View = 'purchase' | 'dashboard';

function App() {
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [currentMailboxId, setCurrentMailboxId] = useState<string>('');
  const [myMailboxes, setMyMailboxes] = useState<string[]>([]);
  const [view, setView] = useState<View>('purchase');
  const [backendHealthy, setBackendHealthy] = useState(false);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    if (connectedAddress) {
      loadUserMailboxes();
    }
  }, [connectedAddress]);

  const checkBackendHealth = async () => {
    const healthy = await apiService.healthCheck();
    setBackendHealthy(healthy);
  };

  const loadUserMailboxes = async () => {
    try {
      const mailboxes = await web3Service.getBuyerMailboxes();
      setMyMailboxes(mailboxes);
    } catch (error) {
      console.error('Failed to load mailboxes:', error);
    }
  };

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  const handleDisconnect = () => {
    setConnectedAddress('');
    setCurrentMailboxId('');
    setMyMailboxes([]);
    setView('purchase');
  };

  const handlePurchaseSuccess = (mailboxId: string) => {
    setCurrentMailboxId(mailboxId);
    setView('dashboard');
    loadUserMailboxes();
  };

  const handleViewMailbox = (mailboxId: string) => {
    setCurrentMailboxId(mailboxId);
    setView('dashboard');
  };

  const handleBackToPurchase = () => {
    setCurrentMailboxId('');
    setView('purchase');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <Mail className="text-sky-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Agent's Toolbox
                <Sparkles className="text-yellow-300" size={24} />
              </h1>
              <p className="text-white/80">Decentralized Temporary Email Service</p>
            </div>
          </div>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {/* Backend Status */}
        {!backendHealthy && (
          <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
            ⚠️ Backend service is not responding. Please make sure the backend server is running.
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        {!connectedAddress ? (
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto text-center py-12">
            <Mail className="mx-auto text-sky-600 mb-6" size={64} />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Agent's Toolbox
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Purchase temporary email addresses on the Monad blockchain.
              <br />
              Fast, secure, and decentralized.
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <div className="bg-sky-100 text-sky-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Connect Wallet</h3>
                  <p className="text-sm text-gray-600">
                    Connect your MetaMask wallet to get started
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-sky-100 text-sky-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Purchase Mailbox</h3>
                  <p className="text-sm text-gray-600">
                    Choose duration and pay with USDC or MON
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-sky-100 text-sky-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Receive Emails</h3>
                  <p className="text-sm text-gray-600">
                    Use your temporary email and view messages in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* My Mailboxes */}
            {myMailboxes.length > 0 && view === 'purchase' && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">My Mailboxes</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myMailboxes.map((mailboxId) => (
                    <button
                      key={mailboxId}
                      onClick={() => handleViewMailbox(mailboxId)}
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={16} className="text-sky-600" />
                        <span className="font-semibold text-gray-900">Mailbox</span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono truncate">
                        {mailboxId}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View */}
            {view === 'purchase' ? (
              <PurchaseMailbox onPurchaseSuccess={handlePurchaseSuccess} />
            ) : (
              <MailboxDashboard mailboxId={currentMailboxId} onBack={handleBackToPurchase} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 text-center text-white/70 text-sm">
        <p>Built on Monad Blockchain | Monad Hackathon 2026</p>
        <p className="mt-2">
          Powered by{' '}
          <span className="font-semibold text-white">Agent's Toolbox</span> - AI Agent Tool
          Marketplace
        </p>
      </footer>
    </div>
  );
}

export default App;
