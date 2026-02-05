import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: number; // Unix timestamp in seconds
  mailboxId?: string; // Optional for future use
  onExpired?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(expiresAt);
      setTimeLeft(newTimeLeft);

      // Call onExpired callback when mailbox expires
      if (newTimeLeft.isExpired && onExpired) {
        onExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  function calculateTimeLeft(expiresAt: number): TimeLeft {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const difference = expiresAt - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(difference / (24 * 3600));
    const hours = Math.floor((difference % (24 * 3600)) / 3600);
    const minutes = Math.floor((difference % 3600) / 60);
    const seconds = difference % 60;

    return { days, hours, minutes, seconds, isExpired: false };
  }

  function getStatusColor(): string {
    if (timeLeft.isExpired) return 'text-white/40';

    const totalHours = timeLeft.days * 24 + timeLeft.hours;
    if (totalHours < 1) return 'text-red-400'; // Less than 1 hour
    if (totalHours < 6) return 'text-orange-400'; // Less than 6 hours
    return 'text-glass-emerald-400'; // More than 6 hours
  }

  function getStatusIcon() {
    if (timeLeft.isExpired) {
      return <AlertCircle className={getStatusColor()} size={20} />;
    }

    const totalHours = timeLeft.days * 24 + timeLeft.hours;
    if (totalHours < 1) {
      return <AlertCircle className={getStatusColor()} size={20} />;
    }

    return <CheckCircle className={getStatusColor()} size={20} />;
  }

  function getStatusText(): string {
    if (timeLeft.isExpired) return '已过期';

    const totalHours = timeLeft.days * 24 + timeLeft.hours;
    if (totalHours < 1) return '即将过期';
    if (totalHours < 6) return '快要过期';
    return '正常运行';
  }

  function formatTime(value: number): string {
    return value.toString().padStart(2, '0');
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass p-4">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-white/60" />
          <span className="text-sm font-semibold text-white">邮箱状态</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Countdown Display */}
      {!timeLeft.isExpired ? (
        <div className="flex items-center justify-center gap-2">
          {/* Days */}
          {timeLeft.days > 0 && (
            <>
              <div className="text-center">
                <div className="bg-gradient-to-br from-glass-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-[60px] shadow-glass">
                  <div className="text-2xl font-bold text-white">
                    {formatTime(timeLeft.days)}
                  </div>
                </div>
                <div className="text-xs text-white/60 mt-1">天</div>
              </div>
              <span className="text-xl font-bold text-white/40">:</span>
            </>
          )}

          {/* Hours */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-glass-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-[60px] shadow-glass">
              <div className="text-2xl font-bold text-white">
                {formatTime(timeLeft.hours)}
              </div>
            </div>
            <div className="text-xs text-white/60 mt-1">时</div>
          </div>

          <span className="text-xl font-bold text-white/40">:</span>

          {/* Minutes */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-glass-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-[60px] shadow-glass">
              <div className="text-2xl font-bold text-white">
                {formatTime(timeLeft.minutes)}
              </div>
            </div>
            <div className="text-xs text-white/60 mt-1">分</div>
          </div>

          <span className="text-xl font-bold text-white/40">:</span>

          {/* Seconds */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-glass-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-[60px] shadow-glass">
              <div className="text-2xl font-bold text-white">
                {formatTime(timeLeft.seconds)}
              </div>
            </div>
            <div className="text-xs text-white/60 mt-1">秒</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-white/50 text-sm">此邮箱已过期</p>
          <p className="text-xs text-white/40 mt-1">您可以续费以继续使用</p>
        </div>
      )}

      {/* Expiry Date Info */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-xs text-white/50 text-center">
          {timeLeft.isExpired ? (
            <span>
              过期时间: {new Date(expiresAt * 1000).toLocaleString('zh-CN')}
            </span>
          ) : (
            <span>
              将在 {new Date(expiresAt * 1000).toLocaleString('zh-CN')} 过期
            </span>
          )}
        </div>
      </div>

      {/* Warning Message for Soon-to-Expire */}
      {!timeLeft.isExpired && timeLeft.days === 0 && timeLeft.hours < 6 && (
        <div className="mt-3 bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-200">
              <p className="font-semibold mb-1">邮箱即将过期</p>
              <p>请及时续费以避免邮箱失效。续费后可以保留原邮箱地址。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
