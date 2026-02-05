import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { PurchaseMailbox } from './components/PurchaseMailbox';
import { MailboxDashboard } from './components/MailboxDashboard';
import { ReferralSection } from './components/ReferralSection';
import { apiService } from './services/api';
import { web3Service } from './services/web3';
import { Mail, Sparkles } from 'lucide-react';

type View = 'purchase' | 'dashboard' | 'referral';

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

  const handleViewReferral = () => {
    setView('referral');
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-glass-mesh">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl p-3 rounded-xl shadow-glass border border-white/20">
              <Mail className="text-glass-purple-400" size={32} />
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
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-glass-lg border border-white/10 p-6 max-w-2xl mx-auto text-center py-12">
            <div className="bg-gradient-to-br from-glass-purple-500/20 to-glass-emerald-500/20 backdrop-blur-sm w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center border border-white/20">
              <Mail className="text-glass-purple-300" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to Agent's Toolbox
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Purchase temporary email addresses on the Monad blockchain.
              <br />
              Fast, secure, and decentralized.
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-glass-purple-500 to-glass-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold shadow-glass">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white">Connect Wallet</h3>
                  <p className="text-sm text-white/60">
                    Connect your MetaMask wallet to get started
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-glass-purple-500 to-glass-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold shadow-glass">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white">Purchase Mailbox</h3>
                  <p className="text-sm text-white/60">
                    Choose duration and pay with USDC or MON
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-glass-purple-500 to-glass-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold shadow-glass">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white">Receive Emails</h3>
                  <p className="text-sm text-white/60">
                    Use your temporary email and view messages in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs - Glassmorphism */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 p-2 mb-6 flex gap-2">
              <button
                onClick={() => setView('purchase')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  view === 'purchase'
                    ? 'bg-gradient-to-r from-glass-purple-500 to-glass-purple-600 text-white shadow-glass border border-glass-purple-400/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                📬 购买邮箱
              </button>
              <button
                onClick={handleViewReferral}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  view === 'referral'
                    ? 'bg-gradient-to-r from-glass-emerald-500 to-glass-emerald-600 text-white shadow-glass-emerald border border-glass-emerald-400/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                🎁 推荐奖励
              </button>
              {currentMailboxId && (
                <button
                  onClick={() => setView('dashboard')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    view === 'dashboard'
                      ? 'bg-gradient-to-r from-glass-purple-400 via-glass-purple-500 to-glass-purple-600 text-white shadow-glass-lg border border-glass-purple-300/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
                  }`}
                >
                  📧 我的邮箱
                </button>
              )}
            </div>

            {/* My Mailboxes - Glassmorphism */}
            {myMailboxes.length > 0 && view === 'purchase' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">My Mailboxes</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myMailboxes.map((mailboxId) => (
                    <button
                      key={mailboxId}
                      onClick={() => handleViewMailbox(mailboxId)}
                      className="text-left p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 hover:border-glass-purple-400/50 hover:shadow-glass transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={16} className="text-glass-purple-400" />
                        <span className="font-semibold text-white">Mailbox</span>
                      </div>
                      <div className="text-xs text-white/60 font-mono truncate">
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
            ) : view === 'referral' ? (
              <ReferralSection userAddress={connectedAddress} />
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
