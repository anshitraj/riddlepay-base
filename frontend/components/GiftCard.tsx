'use client';

import { Gift } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { useContract } from '@/hooks/useContract';
import { Clock, Gift as GiftIcon, User, CheckCircle, Share2, AlertCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ShareGift from './ShareGift';
import { formatAmount } from '@/utils/formatAmount';
import toast from 'react-hot-toast';

interface GiftCardProps {
  giftId: number;
  gift: Gift;
  onClaim?: () => void;
}

export default function GiftCard({ giftId, gift, onClaim }: GiftCardProps) {
  const { address } = useWallet();
  const { refundGift, isExpired, loading } = useContract();
  const [showShare, setShowShare] = useState(false);
  const [expired, setExpired] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refunded, setRefunded] = useState(false);

  useEffect(() => {
    const checkExpiration = async () => {
      try {
        const expiredStatus = await isExpired(giftId);
        setExpired(expiredStatus);
      } catch (err) {
        console.warn('Error checking expiration:', err);
      }
    };
    
    if (!gift.claimed) {
      checkExpiration();
    }
  }, [giftId, gift.claimed, isExpired]);

  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const handleRefund = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!expired) {
      toast.error('Airdrop has not expired yet');
      return;
    }

    if (gift.claimed) {
      toast.error('Airdrop has already been claimed');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to refund this airdrop? You will receive ${formatAmount(gift.amount, gift.tokenAddress)} back.`
    );

    if (!confirmed) return;

    setRefunding(true);
    const loadingToast = toast.loading('Processing refund...');

    try {
      const txHash = await refundGift(giftId);
      toast.dismiss(loadingToast);
      toast.success('Refund successful! 🎉', {
        duration: 5000,
      });
      
      // Mark as refunded locally
      setRefunded(true);
      setExpired(false); // Hide expired badge since it's now refunded
      
      // Refresh the page or call onClaim to update UI
      if (onClaim) {
        onClaim();
      } else {
        // Don't reload immediately, let user see the refunded status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to refund airdrop');
      console.error('Error refunding airdrop:', err);
    } finally {
      setRefunding(false);
    }
  };

  const isReceiver = address?.toLowerCase() === gift.receiver.toLowerCase();
  const isSender = address?.toLowerCase() === gift.sender.toLowerCase();

  return (
    <motion.div 
      className="bg-baseLight/50 dark:bg-baseLight/50 bg-white/90 dark:bg-baseLight/50 rounded-2xl p-4 sm:p-6 border border-blue-500/20 dark:border-blue-500/20 border-gray-200 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-base-gradient flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GiftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-semibold dark:text-white text-white text-gray-900 dark:text-white">Airdrop #{giftId}</span>
        </div>
        {refunded ? (
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-purple-500/50">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-purple-500 dark:text-purple-500 text-purple-600 dark:text-purple-400">Refunded</span>
          </div>
        ) : gift.claimed ? (
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-green-500/50">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-500 dark:text-green-500 text-green-600 dark:text-green-400">Claimed</span>
          </div>
        ) : expired ? (
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-red-500/50">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-500 dark:text-red-500 text-red-600 dark:text-red-400">Expired</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-yellow-500/50">
            <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-xs font-semibold text-yellow-500 dark:text-yellow-500 text-yellow-600 dark:text-yellow-400">Pending</span>
          </div>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg glass flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
          </div>
          <span className="dark:text-gray-400 text-gray-400 text-gray-600 dark:text-gray-400 break-words">
            {isReceiver ? 'From' : 'To'}:{' '}
            <span className="dark:text-white text-white text-gray-900 dark:text-white font-mono font-semibold">
              {isReceiver
                ? `${gift.sender.slice(0, 6)}...${gift.sender.slice(-4)}`
                : `${gift.receiver.slice(0, 6)}...${gift.receiver.slice(-4)}`}
            </span>
          </span>
        </div>

        {gift.riddle && gift.riddle.trim() && (
          <div className="p-3 sm:p-4 glass rounded-xl border border-border dark:border-border border-gray-200 dark:border-border">
            <p className="dark:text-white text-white text-gray-900 dark:text-white text-xs sm:text-sm leading-relaxed break-words">
              <span className="font-bold text-blue-500">❓ Riddle:</span> {gift.riddle}
            </p>
          </div>
        )}

        {gift.unlockTime && Number(gift.unlockTime) > Math.floor(Date.now() / 1000) && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-500 dark:text-yellow-500 text-yellow-600 dark:text-yellow-400 font-semibold">
              🔒 Unlocks: {new Date(Number(gift.unlockTime) * 1000).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
          <span className="text-xl sm:text-2xl font-extrabold bg-base-gradient bg-clip-text text-transparent">
            {formatAmount(gift.amount, gift.tokenAddress)}
          </span>
          <span className="text-xs dark:text-gray-400 text-gray-400 text-gray-600 dark:text-gray-400 font-medium">
            {formatDate(gift.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 mt-4 flex-wrap">
        {!gift.claimed && isReceiver && onClaim && !expired && (
          <motion.button
            onClick={onClaim}
            className="flex-1 py-3 min-h-[44px] bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 active:scale-95 text-sm touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
                  🎁 Claim Airdrop
          </motion.button>
        )}
        {isSender && expired && !gift.claimed && !refunded && (
          <motion.button
            onClick={handleRefund}
            disabled={refunding || loading}
            className="flex-1 py-3 min-h-[44px] bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl transition-all duration-300 active:scale-95 text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: refunding || loading ? 1 : 1.05 }}
            whileTap={{ scale: refunding || loading ? 1 : 0.95 }}
          >
            {refunding ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Refunding...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Refund Airdrop</span>
              </>
            )}
          </motion.button>
        )}
        {refunded && (
          <div className="flex-1 py-3 min-h-[44px] bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Refunded</span>
          </div>
        )}
        {isSender && !expired && !refunded && (
          <motion.button
            onClick={() => setShowShare(true)}
            className="px-4 py-3 min-h-[44px] glass rounded-xl border border-blue-500/20 dark:border-blue-500/20 border-gray-200 dark:border-blue-500/20 dark:text-white text-white text-gray-900 dark:text-white transition-all duration-300 active:scale-95 text-sm flex items-center justify-center gap-2 touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </motion.button>
        )}
      </div>

      {showShare && (
        <ShareGift giftId={giftId} onClose={() => setShowShare(false)} />
      )}
    </motion.div>
  );
}

