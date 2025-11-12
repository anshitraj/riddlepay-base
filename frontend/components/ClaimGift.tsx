'use client';

import { useState, useEffect } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gift } from '@/hooks/useContract';
import { formatAmount } from '@/utils/formatAmount';

interface ClaimGiftProps {
  giftId: number;
  gift: Gift;
  onClaimSuccess?: () => void;
}

export default function ClaimGift({ giftId, gift, onClaimSuccess }: ClaimGiftProps) {
  const { address, ensureBaseMainnet } = useWallet();
  const { claimGift, loading, error, isExpired } = useContract();
  
  const [guess, setGuess] = useState('');
  const [expired, setExpired] = useState(false);
  const [isTimeLocked, setIsTimeLocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const checkExpiry = async () => {
      try {
        const expiredStatus = await isExpired(giftId);
        setExpired(expiredStatus);
        
        // Check if gift is time-locked
        if (gift.unlockTime) {
          const unlockTimestamp = Number(gift.unlockTime);
          const currentTimestamp = Math.floor(Date.now() / 1000);
          setIsTimeLocked(currentTimestamp < unlockTimestamp);
        }
      } catch (err) {
        console.warn('Error checking expiry (non-critical):', err);
        // Don't set expired if we can't check - let user try to claim
      }
    };
    checkExpiry();
  }, [giftId, isExpired, gift.unlockTime]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (address.toLowerCase() !== gift.receiver.toLowerCase()) {
      toast.error('You are not the receiver of this gift');
      return;
    }

    // Check if it's a direct gift (no riddle)
    const isDirectGift = !gift.riddle || gift.riddle.trim() === '';
    
    if (!isDirectGift && !guess) {
      toast.error('Please enter your guess');
      return;
    }

    const loadingToast = toast.loading('Claiming your gift...');

    try {
      // Ensure we're on Base Mainnet before sending transaction
      await ensureBaseMainnet();
      
      // For direct gifts, pass empty string. For riddle gifts, pass the guess.
      const hash = await claimGift(giftId, isDirectGift ? '' : guess);
      setTxHash(hash);
      setSuccess(true);
      setShowConfetti(true);
      
      toast.dismiss(loadingToast);
      toast.success('Gift Claimed! 🎉', {
        duration: 5000,
      });

      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      // Refresh the gift list after successful claim
      if (onClaimSuccess) {
        // Wait for transaction confirmation and blockchain indexing
        // Base Sepolia typically confirms in 1-2 seconds, but indexing can take longer
        setTimeout(() => {
          onClaimSuccess();
        }, 5000);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      if (err.message?.includes('Wrong answer')) {
        toast.error('Wrong Answer 😅');
      } else {
        toast.error(err.message || 'Failed to claim gift');
      }
      console.error('Error claiming gift:', err);
    }
  };

  // formatAmount is now imported from utils

  if (success) {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}
        <motion.div 
          className="bg-baseLight/50 rounded-2xl p-8 text-center border border-green-500/50 shadow-xl shadow-green-500/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            🎉
          </motion.div>
          <h3 className="text-3xl font-bold bg-base-gradient bg-clip-text text-transparent mb-3">
            Gift Claimed!
          </h3>
          <p className="dark:text-white text-gray-900 mb-6 text-lg">You successfully unlocked the gift!</p>
          
          {gift.message && gift.message.trim() && (
            <motion.div 
              className="mt-6 p-5 bg-baseBlue/10 border border-baseBlue/30 rounded-xl text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="text-lg font-semibold text-baseBlue mb-2">
                💌 Message from {gift.sender.slice(0, 6)}...{gift.sender.slice(-4)}:
              </h4>
              <p className="dark:text-gray-200 text-gray-800 leading-relaxed">{gift.message}</p>
            </motion.div>
          )}
          
          {txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 glass rounded-xl text-baseBlue hover:text-baseBlue/80 transition-colors font-semibold border border-baseBlue/20 mt-6"
            >
              <span>View Transaction</span>
              <span>→</span>
            </a>
          )}
        </motion.div>
      </>
    );
  }

  if (gift.claimed) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center border border-border">
        <div className="text-5xl mb-4">🔓</div>
        <p className="dark:text-white text-gray-900 text-lg">This gift has already been claimed</p>
      </div>
    );
  }

  if (isTimeLocked) {
    const unlockTimestamp = Number(gift.unlockTime);
    const unlockDate = new Date(unlockTimestamp * 1000);
    return (
      <div className="bg-baseLight/50 rounded-2xl p-8 text-center border border-yellow-500/50 shadow-lg">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-yellow-500 dark:text-yellow-400 text-lg font-semibold mb-2">This gift is time-locked</p>
        <p className="dark:text-gray-300 text-gray-700 text-sm">
          Unlocks at: {unlockDate.toLocaleString()}
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="bg-baseLight/50 rounded-2xl p-8 text-center border border-yellow-500/50 shadow-lg">
        <div className="text-5xl mb-4">⏰</div>
        <p className="text-yellow-500 dark:text-yellow-400 text-lg font-semibold">This gift has expired (7 days)</p>
      </div>
    );
  }

  if (address?.toLowerCase() !== gift.receiver.toLowerCase()) {
    return (
      <div className="bg-baseLight/50 rounded-2xl p-8 text-center border border-border shadow-lg">
        <div className="text-5xl mb-4">🚫</div>
        <p className="dark:text-white text-gray-900 text-lg">This gift is not for you</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-baseLight/50 rounded-2xl p-8 md:p-10 border border-baseBlue/20 shadow-lg backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-base-gradient flex items-center justify-center text-2xl shadow-lg shadow-baseBlue/30">
          🎁
        </div>
        <h3 className="text-3xl font-bold bg-base-gradient bg-clip-text text-transparent">
          Claim Your Gift
        </h3>
      </div>
      
      <div className="mb-6 p-5 glass rounded-xl border border-border">
        <p className="dark:text-white text-gray-900 mb-3 text-lg">
          {gift.riddle && gift.riddle.trim() ? (
            <>
              <span className="font-bold text-blue-500">❓ Riddle:</span> {gift.riddle}
            </>
          ) : (
            <span className="font-bold text-green-500">🎁 Direct Gift (No Riddle Required)</span>
          )}
        </p>
        <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
          <span className="font-semibold dark:text-gray-400 text-gray-600">💰 Amount:</span> {formatAmount(gift.amount, gift.tokenAddress)}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-5 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleClaim} className="space-y-6">
        {gift.riddle && gift.riddle.trim() && (
          <div>
            <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-blue-500">💡</span>
              Your Answer
            </label>
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your guess..."
              className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              required
            />
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-baseBlue/50 active:scale-[0.98] text-lg"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? '✨ Claiming...' : gift.riddle && gift.riddle.trim() ? '🎁 Claim Gift' : '🎁 Claim Direct Gift'}
        </motion.button>
      </form>
    </motion.div>
  );
}

