'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gift, MapPin, HelpCircle, Lock, MessageSquare, Clock, Coins, AlertCircle, Camera } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import RiddlePayLogo from './RiddlePayLogo';
import SuggestedRiddles from './SuggestedRiddles';
import ConversationalFeedback from './ConversationalFeedback';
import QRScanner from './QRScanner';
import SuccessAnimation from './SuccessAnimation';

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
  const [expirationTime, setExpirationTime] = useState('7days'); // Default: 7 days
  const [customExpirationHours, setCustomExpirationHours] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<'sending' | 'sent' | 'suggest' | undefined>();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const validateForm = () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!receiver || !amount) {
      toast.error('Please fill in receiver address and amount');
      return false;
    }

    // If riddle is provided, answer must also be provided
    if (riddle.trim() && !answer.trim()) {
      toast.error('Please provide an answer for the riddle');
      return false;
    }

    // Security: Input validation
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(receiver)) {
      toast.error('Invalid receiver address format');
      return false;
    }

    // Validate string lengths (matching contract limits)
    if (riddle.length > 500) {
      toast.error('Riddle must be 500 characters or less');
      return false;
    }
    if (riddle.trim() && answer.length > 200) {
      toast.error('Answer must be 200 characters or less');
      return false;
    }
    if (message.length > 1000) {
      toast.error('Message must be 1000 characters or less');
      return false;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount must be a positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setFeedbackAction('sending');

    const loadingToast = toast.loading(isETH ? 'Creating your secret gift...' : 'Checking USDC approval...');

    try {
      // Ensure we're on Base Mainnet before sending transaction
      await ensureBaseMainnet();
      
      // Convert unlockTime to Unix timestamp (0 = immediately)
      // Set time to start of day (00:00:00) for date-only inputs
      let unlockTimestamp = 0;
      if (unlockTime) {
        const unlockDate = new Date(unlockTime);
        unlockDate.setHours(0, 0, 0, 0); // Set to start of day
        unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        if (unlockTimestamp < now) {
          toast.error('Unlock day must be in the future');
          toast.dismiss(loadingToast);
          return;
        }
      }
      
      // Calculate expiration timestamp from UI selection
      let expirationTimestamp = 0; // 0 = use default 7 days
      const now = Math.floor(Date.now() / 1000);
      
      if (expirationTime === '24hours') {
        expirationTimestamp = now + (24 * 60 * 60); // 24 hours
      } else if (expirationTime === '7days') {
        expirationTimestamp = now + (7 * 24 * 60 * 60); // 7 days
      } else if (expirationTime === '1month') {
        expirationTimestamp = now + (30 * 24 * 60 * 60); // 30 days
      } else if (expirationTime === 'custom' && customExpirationHours) {
        const hours = Number(customExpirationHours);
        if (hours < 1) {
          toast.error('Custom expiration must be at least 1 hour');
          toast.dismiss(loadingToast);
          return;
        }
        if (hours > 365 * 24) {
          toast.error('Custom expiration cannot exceed 1 year');
          toast.dismiss(loadingToast);
          return;
        }
        expirationTimestamp = now + (hours * 60 * 60); // Convert hours to seconds
      }
      // If expirationTime is not set or is default, expirationTimestamp remains 0 (contract uses default)
      
      // Update toast message based on token type
      if (!isETH) {
        toast.loading('Approving USDC... (This may require a MetaMask transaction)', { id: loadingToast });
      } else {
        toast.loading('Creating your secret gift...', { id: loadingToast });
      }
      
      // Pass empty answer if no riddle (direct gift)
      const hash = await createGift(receiver, riddle, riddle.trim() ? answer : '', message, amount, isETH, unlockTimestamp, expirationTimestamp);
      
      // Update toast to show transaction is being processed
      toast.loading('Transaction confirmed! Creating gift...', { id: loadingToast });
      setTxHash(hash);
      setSuccess(true);
      
      toast.dismiss(loadingToast);
      
      // Award XP
      if (address) {
        const hasRiddle = riddle.trim().length > 0;
        const currentXP = getUserXP(address);
        const newXP = addXP(address, 'send', hasRiddle);
        const xpEarned = newXP - currentXP;
        toast.success(`Airdrop Sent 🎁 +${xpEarned} XP earned! ⭐`, {
          duration: 5000,
        });
      } else {
        toast.success('Airdrop Sent 🎁', {
          duration: 5000,
        });
      }
      
      setFeedbackAction('sent');
      setShowSuccessAnimation(true);

      // Reset form
      setTimeout(() => {
        setReceiver('');
        setRiddle('');
        setAnswer('');
        setMessage('');
        setAmount('');
        setUnlockTime('');
        setExpirationTime('7days');
        setCustomExpirationHours('');
        setSuccess(false);
        setTxHash('');
        setFeedbackAction(undefined);
      }, 5000);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to create gift 😅');
      console.error('Error creating gift:', err);
      setFeedbackAction(undefined);
    }
  };

  const getTokenAddress = () => {
    return isETH ? '0x0000000000000000000000000000000000000000' : (process.env.NEXT_PUBLIC_USDC_ADDRESS || '');
  };

  if (!address) {
    return (
      <motion.div 
        className="bg-white dark:bg-baseLight/50 rounded-2xl p-12 text-center border border-gray-200 dark:border-blue-500/20 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-400" />
        <p className="text-gray-700 dark:text-gray-300 text-lg">Please connect your wallet to send a gift</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white dark:bg-baseLight/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-200 dark:border-blue-500/20 shadow-lg dark:shadow-lg backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
            Send Secret Airdrop
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-0 sm:ml-10 md:ml-12">
          Enter recipient details and customize your airdrop.
        </p>
      </div>
      
      {success && (
        <div className="mb-6 p-5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-700 dark:text-green-400 font-semibold text-lg">Airdrop created successfully!</p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline mt-1 inline-block transition-colors"
                >
                  View on BaseScan →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
        <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span>Recipient Wallet Address</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 touch-manipulation"
              required
            />
            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] min-w-[44px] bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all touch-manipulation flex items-center justify-center"
              title="Scan QR Code"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span>Riddle Challenge</span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 font-normal">(Optional)</span>
          </label>
          <textarea
            value={riddle}
            onChange={(e) => setRiddle(e.target.value)}
            placeholder="What has keys but no locks? (Leave empty for direct airdrop)"
            rows={3}
            className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 resize-none touch-manipulation"
          />
          <SuggestedRiddles 
            onSelect={(riddleText, answerText) => {
              setRiddle(riddleText);
              setAnswer(answerText);
            }} 
          />
        </div>

        {riddle.trim() && (
          <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
            <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
              <span>Answer (hidden from receiver)</span>
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="piano"
              className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 touch-manipulation"
              required={riddle.trim().length > 0}
            />
          </div>
        )}

        <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span>Personal Message</span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 font-normal">(Revealed After Claim)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Happy holidays! Hope you enjoy this gift..."
            rows={3}
            className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 resize-none touch-manipulation"
          />
        </div>

        {/* Gift Settings Section Divider */}
        <div className="pt-3 sm:pt-4 md:pt-6 border-t border-gray-600 dark:border-gray-700">
          <div className="mb-3 sm:mb-4 md:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1">Airdrop Settings</h3>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">Set unlock time and transfer amount</p>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span>Unlock Day</span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 font-normal">(Optional)</span>
          </label>
          <input
            type="date"
            value={unlockTime}
            onChange={(e) => setUnlockTime(e.target.value)}
            className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 touch-manipulation"
          />
          {unlockTime && (
            <p className="mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Airdrop will unlock on: {new Date(unlockTime).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span>Expiration Time</span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 font-normal">(Auto-refund if not claimed)</span>
          </label>
          <div className="space-y-2 sm:space-y-3">
            <select
              value={expirationTime}
              onChange={(e) => setExpirationTime(e.target.value)}
              className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 cursor-pointer touch-manipulation"
            >
              <option value="24hours">24 Hours</option>
              <option value="7days">7 Days</option>
              <option value="1month">1 Month (30 days)</option>
              <option value="custom">Custom Time</option>
            </select>
            {expirationTime === 'custom' && (
              <div>
                <input
                  type="number"
                  value={customExpirationHours}
                  onChange={(e) => setCustomExpirationHours(e.target.value)}
                  placeholder="Enter hours (e.g., 48 for 2 days)"
                  min="1"
                  className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 touch-manipulation"
                />
                {customExpirationHours && (
                  <p className="mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    Airdrop will expire in: {Number(customExpirationHours) >= 24 
                      ? `${(Number(customExpirationHours) / 24).toFixed(1)} days`
                      : `${customExpirationHours} hours`}
                  </p>
                )}
              </div>
            )}
            {expirationTime !== 'custom' && (
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                {expirationTime === '24hours' && 'Airdrop will expire in 24 hours if not claimed'}
                {expirationTime === '7days' && 'Airdrop will expire in 7 days if not claimed'}
                {expirationTime === '1month' && 'Airdrop will expire in 30 days if not claimed'}
              </p>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:glass rounded-lg sm:rounded-xl border border-gray-600 dark:border-gray-700 shadow-sm hover:border-gray-500 dark:hover:border-gray-600 transition-all duration-200">
          <label className="block text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span>Airdrop Amount</span>
          </label>
          <div className="flex gap-2 sm:gap-3">
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isETH ? "0.001" : "1.0"}
              className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 touch-manipulation"
              required
            />
            <select
              value={isETH ? 'ETH' : 'USDC'}
              onChange={(e) => setIsETH(e.target.value === 'ETH')}
              className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-3.5 min-h-[44px] text-sm sm:text-base bg-white dark:bg-baseLight/30 border border-gray-300 dark:border-border text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all duration-200 cursor-pointer touch-manipulation flex-shrink-0"
            >
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        <div className="pt-3 sm:pt-4 md:pt-6">
          <motion.button
            type="submit"
            disabled={loading || approving}
            className="w-full py-3 sm:py-4 md:py-5 min-h-[52px] sm:min-h-[56px] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm sm:text-base md:text-lg touch-manipulation shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            whileHover={{ scale: loading || approving ? 1 : 1.02 }}
            whileTap={{ scale: loading || approving ? 1 : 0.98 }}
          >
            {approving ? (
              <>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Approving USDC...</span>
              </>
            ) : loading ? (
              <>
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                <span>Creating Gift...</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Send Airdrop Securely</span>
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Footer Branding */}
      <div className="mt-8 pt-6 border-t border-gray-600 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <RiddlePayLogo size={16} showText={false} />
            <span>Powered by <span className="font-semibold text-gray-600 dark:text-gray-400">Riddle Pay</span></span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        receiver={receiver}
        amount={amount}
        tokenAddress={getTokenAddress()}
        isETH={isETH}
        hasRiddle={riddle.trim().length > 0}
        unlockTime={unlockTime}
        loading={loading || approving}
      />
      
      {/* Conversational Feedback */}
      <ConversationalFeedback action={feedbackAction} />
      
      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={(address) => {
          setReceiver(address);
          setShowQRScanner(false);
        }}
      />
      
      {/* Success Animation */}
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
      />
    </motion.div>
  );
}

