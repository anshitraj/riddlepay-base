'use client';

import { Gift } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { useContract } from '@/hooks/useContract';
import { Clock, Gift as GiftIcon, User, CheckCircle, Share2, AlertCircle, RotateCcw } from 'lucide-react';
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

  // Get status badge styling
  const getStatusBadge = () => {
    if (refunded) {
      return (
        <span className="text-xs px-3 py-1 rounded-full border border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30">
          Refunded
        </span>
      );
    }
    if (gift.claimed) {
      return (
        <span className="text-xs px-3 py-1 rounded-full border border-green-200 text-green-600 bg-green-50 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
          Claimed
        </span>
      );
    }
    if (expired) {
      return (
        <span className="text-xs px-3 py-1 rounded-full border border-red-200 text-red-600 bg-red-50 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30">
          Expired
        </span>
      );
    }
    return (
      <span className="text-xs px-3 py-1 rounded-full border border-yellow-200 text-yellow-700 bg-yellow-50 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30">
        Pending
      </span>
    );
  };

  const shortAddress = isReceiver
    ? `${gift.sender.slice(0, 6)}...${gift.sender.slice(-4)}`
    : `${gift.receiver.slice(0, 6)}...${gift.receiver.slice(-4)}`;

  return (
    <div className="bg-white dark:bg-baseLight/50 border border-gray-200 dark:border-blue-500/20 rounded-xl shadow-sm p-4 mb-4">
      {/* Top row - Badge and Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl">
            🎁
          </div>
          <div className="font-semibold text-[#1e293b] dark:text-white">Airdrop #{giftId}</div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Receiver Address */}
      <div className="text-sm text-[#6b7280] dark:text-gray-400 flex items-center gap-2 mb-2">
        <span>👤</span>
        <span>{isReceiver ? 'From' : 'To'}: {shortAddress}</span>
      </div>

      {/* Riddle Box */}
      {gift.riddle && gift.riddle.trim() && (
        <div className="bg-[#f8f9ff] dark:bg-[#0E152B]/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-[#374151] dark:text-gray-300 mb-3">
          <span className="font-medium text-red-500 dark:text-red-400">Riddle:</span> {gift.riddle}
        </div>
      )}

      {/* Unlock Time */}
      {gift.unlockTime && Number(gift.unlockTime) > Math.floor(Date.now() / 1000) && (
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-3 mb-3">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold">
            🔒 Unlocks: {new Date(Number(gift.unlockTime) * 1000).toLocaleString()}
          </p>
        </div>
      )}

      {/* Amount - Main Highlight */}
      <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3">
        {formatAmount(gift.amount, gift.tokenAddress)}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-700 my-3"></div>

      {/* Footer - Date and Share */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#9ca3af] dark:text-gray-500">{formatDate(gift.createdAt)}</span>
        {isSender && !expired && !refunded && (
          <button
            onClick={() => setShowShare(true)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[#6b7280] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0E152B]/40 transition-colors duration-75"
            title="Share airdrop"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {!gift.claimed && isReceiver && onClaim && !expired && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClaim}
            className="w-full py-3 min-h-[44px] bg-[#eef2ff] dark:bg-base-gradient text-[#4f6ef7] dark:text-white font-semibold rounded-xl border border-[#dce2ff] dark:border-transparent hover:bg-[#e4e8ff] dark:hover:opacity-90 transition-colors duration-75 text-sm touch-manipulation"
          >
            🎁 Claim Airdrop
          </button>
        </div>
      )}
      {isSender && expired && !gift.claimed && !refunded && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleRefund}
            disabled={refunding || loading}
            className="w-full py-3 min-h-[44px] bg-[#ffecec] dark:bg-gradient-to-r dark:from-red-600 dark:to-red-500 text-[#e03131] dark:text-white font-semibold rounded-lg dark:rounded-xl border border-[#ffd6d6] dark:border-transparent hover:bg-[#ffd6d6] dark:hover:opacity-90 transition-colors duration-75 text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm dark:shadow-none"
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
          </button>
        </div>
      )}

      {showShare && (
        <ShareGift giftId={giftId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

