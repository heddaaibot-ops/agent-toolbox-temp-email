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
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sky-100 p-3 rounded-lg">
          <Mail className="text-sky-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Mailbox</h2>
          <p className="text-gray-600">Get your temporary email address</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Clock className="inline mr-2" size={16} />
            Duration (hours)
          </label>
          <input
            type="range"
            min="1"
            max="24"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>1 hour</span>
            <span className="font-semibold text-sky-600">{duration} hours</span>
            <span>24 hours</span>
          </div>
        </div>

        {/* Payment Token Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <DollarSign className="inline mr-2" size={16} />
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentToken('MON')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentToken === 'MON'
                  ? 'border-sky-600 bg-sky-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">MON</div>
              <div className="text-xs text-gray-600">Native Token</div>
            </button>
            <button
              onClick={() => setPaymentToken('USDC')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentToken === 'USDC'
                  ? 'border-sky-600 bg-sky-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">USDC</div>
              <div className="text-xs text-gray-600">Stablecoin</div>
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total Price:</span>
            <span className="text-2xl font-bold text-gray-900">
              {calculatePrice()} {paymentToken}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            {paymentToken === 'USDC' ? '$0.10' : '0.001 MON'} per hour
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

        <p className="text-xs text-gray-600 text-center">
          Your temporary email will be created on the blockchain and accessible immediately after purchase.
        </p>
      </div>
    </div>
  );
}
