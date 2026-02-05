import { useState } from 'react';
import { Mail, Clock, DollarSign, Loader2 } from 'lucide-react';
import { web3Service } from '../services/web3';

interface PurchaseMailboxProps {
  onPurchaseSuccess: (mailboxId: string) => void;
}

export function PurchaseMailbox({ onPurchaseSuccess }: PurchaseMailboxProps) {
  const [duration, setDuration] = useState(1);
  const [paymentToken, setPaymentToken] = useState<'USDC' | 'MON'>('MON');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string>('');

  const calculatePrice = () => {
    if (paymentToken === 'USDC') {
      return (duration * 0.1).toFixed(2);
    } else {
      return (duration * 0.001).toFixed(4);
    }
  };

  const handlePurchase = async () => {
    try {
      setError('');
      setIsPurchasing(true);

      if (!web3Service.isConnected()) {
        throw new Error('Please connect your wallet first');
      }

      const mailboxId = await web3Service.purchaseMailbox(duration, paymentToken);

      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      onPurchaseSuccess(mailboxId);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      setError(error.message || 'Failed to purchase mailbox');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-glass-lg border border-white/10 p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-glass-purple-500/20 to-glass-purple-600/20 backdrop-blur-sm p-3 rounded-xl border border-white/20">
          <Mail className="text-glass-purple-300" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Purchase Mailbox</h2>
          <p className="text-white/60">Get your temporary email address</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            <Clock className="inline mr-2" size={16} />
            Duration (hours)
          </label>
          <input
            type="range"
            min="1"
            max="24"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-glass-purple-500"
          />
          <div className="flex justify-between text-sm text-white/60 mt-2">
            <span>1 hour</span>
            <span className="font-semibold text-glass-purple-300">{duration} hours</span>
            <span>24 hours</span>
          </div>
        </div>

        {/* Payment Token Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            <DollarSign className="inline mr-2" size={16} />
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentToken('MON')}
              className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                paymentToken === 'MON'
                  ? 'border-glass-purple-400 bg-glass-purple-500/20 shadow-glass'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="font-semibold text-white">MON</div>
              <div className="text-xs text-white/60">Native Token</div>
            </button>
            <button
              onClick={() => setPaymentToken('USDC')}
              className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                paymentToken === 'USDC'
                  ? 'border-glass-purple-400 bg-glass-purple-500/20 shadow-glass'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="font-semibold text-white">USDC</div>
              <div className="text-xs text-white/60">Stablecoin</div>
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-gradient-to-br from-glass-emerald-500/10 to-glass-purple-500/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-white/80">Total Price:</span>
            <span className="text-2xl font-bold text-white">
              {calculatePrice()} {paymentToken}
            </span>
          </div>
          <div className="text-xs text-white/50 mt-2">
            {paymentToken === 'USDC' ? '$0.10' : '0.001 MON'} per hour
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full bg-gradient-to-r from-glass-purple-500 via-glass-purple-600 to-glass-purple-700 hover:from-glass-purple-400 hover:via-glass-purple-500 hover:to-glass-purple-600 text-white font-semibold py-4 text-lg rounded-2xl shadow-glass-lg hover:shadow-glass transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-glass-purple-400/30"
        >
          {isPurchasing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            <>
              <Mail size={20} />
              Purchase Mailbox
            </>
          )}
        </button>

        <p className="text-xs text-white/50 text-center">
          Your temporary email will be created on the blockchain and accessible immediately after purchase.
        </p>
      </div>
    </div>
  );
}
