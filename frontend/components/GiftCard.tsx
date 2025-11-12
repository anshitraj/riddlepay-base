'use client';

import { Gift } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { Clock, Gift as GiftIcon, User, CheckCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ShareGift from './ShareGift';
import { formatAmount } from '@/utils/formatAmount';

interface GiftCardProps {
  giftId: number;
  gift: Gift;
  onClaim?: () => void;
}

export default function GiftCard({ giftId, gift, onClaim }: GiftCardProps) {
  const { address } = useWallet();
  const [showShare, setShowShare] = useState(false);

  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const isReceiver = address?.toLowerCase() === gift.receiver.toLowerCase();
  const isSender = address?.toLowerCase() === gift.sender.toLowerCase();

  return (
    <motion.div 
      className="bg-baseLight/50 rounded-2xl p-6 border border-baseBlue/20 hover:border-baseBlue/50 transition-all duration-300 hover:shadow-xl hover:shadow-baseBlue/20 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-base-gradient flex items-center justify-center shadow-lg shadow-baseBlue/30">
            <GiftIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold dark:text-white text-gray-900">Gift #{giftId}</span>
        </div>
        {gift.claimed ? (
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-green-500/50">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-500 dark:text-green-400">Claimed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-yellow-500/50">
            <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-xs font-semibold text-yellow-500 dark:text-yellow-400">Pending</span>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-5">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-lg glass flex items-center justify-center">
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <span className="dark:text-gray-400 text-gray-600">
            {isReceiver ? 'From' : 'To'}:{' '}
            <span className="dark:text-white text-gray-900 font-mono font-semibold">
              {isReceiver
                ? `${gift.sender.slice(0, 6)}...${gift.sender.slice(-4)}`
                : `${gift.receiver.slice(0, 6)}...${gift.receiver.slice(-4)}`}
            </span>
          </span>
        </div>

        <div className="p-4 glass rounded-xl border border-border">
          <p className="dark:text-white text-gray-900 text-sm leading-relaxed">
            <span className="font-bold text-blue-500">❓ Riddle:</span> {gift.riddle}
          </p>
        </div>

        {gift.unlockTime && Number(gift.unlockTime) > Math.floor(Date.now() / 1000) && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-500 dark:text-yellow-400 font-semibold">
              🔒 Unlocks: {new Date(Number(gift.unlockTime) * 1000).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-extrabold bg-base-gradient bg-clip-text text-transparent">
            {formatAmount(gift.amount, gift.tokenAddress)}
          </span>
          <span className="text-xs dark:text-gray-400 text-gray-600 font-medium">
            {formatDate(gift.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        {!gift.claimed && isReceiver && onClaim && (
          <motion.button
            onClick={onClaim}
            className="flex-1 py-3 bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-baseBlue/50 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎁 Claim Gift
          </motion.button>
        )}
        {isSender && (
          <motion.button
            onClick={() => setShowShare(true)}
            className="px-4 py-3 glass rounded-xl border border-baseBlue/20 dark:text-white text-gray-900 transition-all duration-300 hover:scale-105 text-sm flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </motion.button>
        )}
      </div>

      {showShare && (
        <ShareGift giftId={giftId} onClose={() => setShowShare(false)} />
      )}
    </motion.div>
  );
}

