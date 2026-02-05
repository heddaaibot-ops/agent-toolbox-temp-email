import { useState, useEffect } from 'react';
import { Gift, Copy, Users, DollarSign, ExternalLink, CheckCircle } from 'lucide-react';
import { web3Service } from '../services/web3';

interface ReferralSectionProps {
  userAddress: string;
}

export function ReferralSection({ userAddress }: ReferralSectionProps) {
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    rewards: '0',
    count: 0
  });

  useEffect(() => {
    if (userAddress) {
      // 生成推荐链接
      const baseUrl = window.location.origin;
      const link = `${baseUrl}?ref=${userAddress}`;
      setReferralLink(link);

      // 获取推荐奖励
      loadReferralStats();
    }
  }, [userAddress]);

  const loadReferralStats = async () => {
    try {
      if (!web3Service.isConnected()) return;

      // 从合约读取推荐奖励
      const rewards = await web3Service.getReferralRewards();
      setReferralStats({
        rewards,
        count: 0 // TODO: 可以添加计数逻辑
      });
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('复制失败，请手动复制');
    }
  };

  const claimRewards = async () => {
    try {
      await web3Service.claimReferralReward();
      alert('奖励领取成功！');
      loadReferralStats();
    } catch (error: any) {
      alert(`领取失败: ${error.message || '未知错误'}`);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `🎉 加入 Agent's Toolbox！\n\n去中心化临时邮箱服务，建立在 Monad 区块链上。\n\n使用我的推荐链接注册，我们都能获得 10% 返现！💰\n\n#Monad #Web3 #DApp`
    );
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-glass-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-glass-purple-500/20 backdrop-blur-sm border border-glass-purple-400/30 p-3 rounded-xl">
          <Gift className="text-glass-purple-300" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">推荐奖励计划</h2>
          <p className="text-white/60">邀请朋友，双方都获得 10% 返现</p>
        </div>
      </div>

      {/* 推荐统计 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-glass-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border border-glass-purple-400/30 rounded-2xl p-4 shadow-glass">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-glass-purple-300" />
            <span className="text-sm text-white/60">可领取奖励</span>
          </div>
          <div className="text-2xl font-bold text-white">{referralStats.rewards} MON</div>
          {parseFloat(referralStats.rewards) > 0 && (
            <button
              onClick={claimRewards}
              className="mt-2 text-sm bg-gradient-to-r from-glass-purple-600 to-fuchsia-600 hover:shadow-glass hover:scale-105 border border-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-sm transition-all duration-200"
            >
              立即领取
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-glass-emerald-500/20 to-cyan-500/20 backdrop-blur-md border border-glass-emerald-400/30 rounded-2xl p-4 shadow-glass">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-glass-emerald-300" />
            <span className="text-sm text-white/60">已邀请用户</span>
          </div>
          <div className="text-2xl font-bold text-white">{referralStats.count} 人</div>
          <div className="text-xs text-white/50 mt-2">每次购买您都能获得 10% 返现</div>
        </div>
      </div>

      {/* 推荐链接 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            您的专属推荐链接
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:bg-white/10 focus:border-glass-purple-400/50 placeholder:text-white/40"
            />
            <button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-glass-purple-600 to-fuchsia-600 hover:shadow-glass hover:scale-105 border border-white/20 text-white p-3 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
              title="复制链接"
            >
              {copied ? (
                <>
                  <CheckCircle size={20} />
                  <span className="hidden sm:inline">已复制</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span className="hidden sm:inline">复制</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 分享按钮 */}
        <div className="flex gap-2">
          <button
            onClick={shareOnTwitter}
            className="flex-1 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:shadow-glass hover:scale-105 border border-white/20 text-white py-3 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            分享到 Twitter
          </button>
          <button
            onClick={copyToClipboard}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Copy size={18} />
            复制链接
          </button>
        </div>
      </div>

      {/* 推荐说明 */}
      <div className="mt-6 bg-glass-purple-500/10 backdrop-blur-sm border border-glass-purple-400/20 rounded-2xl p-4">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <Gift size={18} className="text-glass-purple-300" />
          推荐计划如何运作
        </h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li className="flex items-start gap-2">
            <span className="text-glass-purple-400 font-bold">1.</span>
            <span>分享您的推荐链接给朋友</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-glass-purple-400 font-bold">2.</span>
            <span>朋友通过您的链接购买邮箱</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-glass-purple-400 font-bold">3.</span>
            <span>您自动获得购买金额的 <strong>10%</strong> 作为 MON 奖励</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-glass-purple-400 font-bold">4.</span>
            <span>随时点击"立即领取"提取您的奖励到钱包</span>
          </li>
        </ul>
      </div>

      {/* 提示 */}
      <div className="mt-4 text-xs text-white/50 text-center">
        💡 提示: 您推荐的用户越多，获得的奖励越多。开始分享吧！
      </div>
    </div>
  );
}
