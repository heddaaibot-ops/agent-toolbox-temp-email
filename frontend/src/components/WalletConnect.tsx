import { useState, useEffect } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { web3Service } from '../services/web3';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    if (window.ethereum?.selectedAddress) {
      handleConnect();
    }
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const addr = await web3Service.connect();
      setAddress(addr);
      onConnect(addr);

      // Get balance
      const bal = await web3Service.getBalance();
      setBalance(parseFloat(bal).toFixed(4));
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      alert(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress('');
    setBalance('0');
    onDisconnect();
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (address) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-xs opacity-70">Balance</div>
          <div className="font-semibold">{balance} MON</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-xs opacity-70">Wallet</div>
          <div className="font-semibold">{shortenAddress(address)}</div>
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
          title="Disconnect"
        >
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-white hover:bg-gray-100 text-gray-900 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Wallet size={20} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
