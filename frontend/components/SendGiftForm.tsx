'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SendGiftForm() {
  const { address, ensureBaseMainnet } = useWallet();
  const { createGift, loading, error, approving } = useContract();
  
  const [receiver, setReceiver] = useState('');
  const [riddle, setRiddle] = useState('');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [isETH, setIsETH] = useState(true);
  const [unlockTime, setUnlockTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!receiver || !amount) {
      toast.error('Please fill in receiver address and amount');
      return;
    }

    // If riddle is provided, answer must also be provided
    if (riddle.trim() && !answer.trim()) {
      toast.error('Please provide an answer for the riddle');
      return;
    }

    // Security: Input validation
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiver)) {
      toast.error('Invalid receiver address format');
      return;
    }

    // Validate string lengths (matching contract limits)
    if (riddle.length > 500) {
      toast.error('Riddle must be 500 characters or less');
      return;
    }
    if (riddle.trim() && answer.length > 200) {
      toast.error('Answer must be 200 characters or less');
      return;
    }
    if (message.length > 1000) {
      toast.error('Message must be 1000 characters or less');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    const loadingToast = toast.loading(isETH ? 'Creating your secret gift...' : 'Checking USDC approval...');

    try {
      // Ensure we're on Base Mainnet before sending transaction
      await ensureBaseMainnet();
      
      // Convert unlockTime to Unix timestamp (0 = immediately)
      let unlockTimestamp = 0;
      if (unlockTime) {
        const unlockDate = new Date(unlockTime);
        unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);
        if (unlockTimestamp < Math.floor(Date.now() / 1000)) {
          toast.error('Unlock time must be in the future');
          toast.dismiss(loadingToast);
          return;
        }
      }
      
      // Update toast message based on token type
      if (!isETH) {
        toast.loading('Approving USDC... (This may require a MetaMask transaction)', { id: loadingToast });
      } else {
        toast.loading('Creating your secret gift...', { id: loadingToast });
      }
      
      // Pass empty answer if no riddle (direct gift)
      const hash = await createGift(receiver, riddle, riddle.trim() ? answer : '', message, amount, isETH, unlockTimestamp);
      
      // Update toast to show transaction is being processed
      toast.loading('Transaction confirmed! Creating gift...', { id: loadingToast });
      setTxHash(hash);
      setSuccess(true);
      
      toast.dismiss(loadingToast);
      toast.success('Gift Sent 🎁', {
        duration: 5000,
      });

      // Reset form
      setTimeout(() => {
        setReceiver('');
        setRiddle('');
        setAnswer('');
        setMessage('');
        setAmount('');
        setUnlockTime('');
        setSuccess(false);
        setTxHash('');
      }, 5000);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to create gift 😅');
      console.error('Error creating gift:', err);
    }
  };

  if (!address) {
    return (
      <motion.div 
        className="bg-baseLight/50 dark:bg-white/80 rounded-2xl p-12 text-center border border-baseBlue/20 dark:border-gray-200 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-5xl mb-4">🔒</div>
        <p className="dark:text-gray-300 text-gray-700 text-lg">Please connect your wallet to send a gift</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-baseLight/50 dark:bg-white/80 rounded-2xl p-8 md:p-10 border border-baseBlue/20 dark:border-gray-200 shadow-lg backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-base-gradient flex items-center justify-center text-2xl shadow-lg shadow-baseBlue/30">
          🎁
        </div>
        <h2 className="text-3xl font-bold bg-base-gradient bg-clip-text text-transparent">
          Send Secret Gift
        </h2>
      </div>
      
      {success && (
        <div className="mb-6 p-5 bg-green-500/10 border border-green-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-500 dark:text-green-400 font-semibold text-lg">Gift created successfully!</p>
              {txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline mt-1 inline-block transition-colors"
                >
                  View on BaseScan →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-5 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">📍</span>
            Receiver Address
          </label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder="0x..."
            className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">❓</span>
            Riddle Question <span className="text-xs text-gray-500 font-normal">(Optional - leave empty for direct gift)</span>
          </label>
          <textarea
            value={riddle}
            onChange={(e) => setRiddle(e.target.value)}
            placeholder="What has keys but no locks? (Leave empty for direct gift)"
            rows={4}
            className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
          />
        </div>

        {riddle.trim() && (
          <div>
            <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-blue-500">🔐</span>
              Answer (hidden from receiver)
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="piano"
              className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              required={riddle.trim().length > 0}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">💌</span>
            Personal Message (revealed after claim)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Happy holidays! Hope you enjoy this gift..."
            rows={3}
            className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">⏰</span>
            Unlock Time (optional - leave empty for immediate unlock)
          </label>
          <input
            type="datetime-local"
            value={unlockTime}
            onChange={(e) => setUnlockTime(e.target.value)}
            className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
          {unlockTime && (
            <p className="mt-2 text-xs text-gray-400">
              Gift will unlock at: {new Date(unlockTime).toLocaleString()}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">💰</span>
            Amount
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isETH ? "0.001" : "1.0"}
            className="flex-1 px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baseBlue/50 focus:border-baseBlue/50 transition-all duration-200"
            required
          />
            <select
              value={isETH ? 'ETH' : 'USDC'}
              onChange={(e) => setIsETH(e.target.value === 'ETH')}
              className="px-6 py-3.5 glass rounded-xl dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-baseBlue/50 transition-all duration-200 cursor-pointer"
            >
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading || approving}
          className="w-full py-4 bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-baseBlue/50 active:scale-[0.98] text-lg"
          whileHover={{ scale: loading || approving ? 1 : 1.02 }}
          whileTap={{ scale: loading || approving ? 1 : 0.98 }}
        >
          {approving 
            ? '⏳ Approving USDC...' 
            : loading 
            ? '✨ Creating Gift...' 
            : '🎁 Create Secret Gift'}
        </motion.button>
      </form>
    </motion.div>
  );
}

