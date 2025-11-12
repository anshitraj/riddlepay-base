'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, X, Users } from 'lucide-react';

interface Recipient {
  address: string;
  amount: string;
}

export default function BulkGiveawayForm() {
  const { address, ensureBaseSepolia } = useWallet();
  const { createBulkGifts, loading, error, approving } = useContract();
  
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', amount: '' }
  ]);
  const [message, setMessage] = useState('');
  const [isETH, setIsETH] = useState(false); // Default to USDC for bulk
  const [unlockTime, setUnlockTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  const addRecipient = () => {
    if (recipients.length >= 100) {
      toast.error('Maximum 100 recipients per batch');
      return;
    }
    setRecipients([...recipients, { address: '', amount: '' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length === 1) {
      toast.error('At least one recipient is required');
      return;
    }
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate all recipients
    const validRecipients = recipients.filter(r => r.address.trim() && r.amount.trim());
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    // Validate addresses
    for (const recipient of validRecipients) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.address)) {
        toast.error(`Invalid address: ${recipient.address}`);
        return;
      }
      const amountNum = parseFloat(recipient.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error(`Invalid amount: ${recipient.amount}`);
        return;
      }
    }

    // Validate message length
    if (message.length > 1000) {
      toast.error('Message must be 1000 characters or less');
      return;
    }

    const loadingToast = toast.loading(`Creating ${validRecipients.length} gifts...`);

    try {
      await ensureBaseSepolia();
      
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

      const receivers = validRecipients.map(r => r.address);
      const amounts = validRecipients.map(r => r.amount);

      const hash = await createBulkGifts(receivers, amounts, isETH, message, unlockTimestamp);
      setTxHash(hash);
      setSuccess(true);
      
      toast.dismiss(loadingToast);
      toast.success(`${validRecipients.length} Gifts Created! 🎁`, {
        duration: 5000,
      });

      // Reset form after 5 seconds
      setTimeout(() => {
        setRecipients([{ address: '', amount: '' }]);
        setMessage('');
        setUnlockTime('');
        setSuccess(false);
        setTxHash('');
      }, 5000);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to create bulk gifts 😅');
      console.error('Error creating bulk gifts:', err);
    }
  };

  const calculateTotal = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
  };

  if (!address) {
    return (
      <motion.div 
        className="bg-baseLight/50 rounded-2xl p-12 text-center border border-baseBlue/20 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-5xl mb-4">🔒</div>
        <p className="dark:text-gray-300 text-gray-700 text-lg">Please connect your wallet to create bulk giveaways</p>
      </motion.div>
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
        <div className="w-12 h-12 rounded-xl bg-purple-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-base-gradient bg-clip-text text-transparent">
          Bulk Giveaway
        </h2>
      </div>
      
      {success && (
        <div className="mb-6 p-5 bg-green-500/10 border border-green-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-500 dark:text-green-400 font-semibold text-lg">Bulk gifts created successfully!</p>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
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
        {/* Token Type */}
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">💰</span>
            Token Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsETH(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                !isETH
                  ? 'bg-base-gradient text-white shadow-lg shadow-baseBlue/30'
                  : 'glass dark:text-white text-gray-900 border border-border'
              }`}
            >
              USDC
            </button>
            <button
              type="button"
              onClick={() => setIsETH(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                isETH
                  ? 'bg-base-gradient text-white shadow-lg shadow-baseBlue/30'
                  : 'glass dark:text-white text-gray-900 border border-border'
              }`}
            >
              ETH
            </button>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold dark:text-white text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">👥</span>
              Recipients ({recipients.length}/100)
            </label>
            <button
              type="button"
              onClick={addRecipient}
              className="px-4 py-2 glass rounded-xl border border-baseBlue/20 dark:text-white text-gray-900 text-sm font-medium hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {recipients.map((recipient, index) => (
              <motion.div
                key={index}
                className="flex gap-3 items-start p-4 glass rounded-xl border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={recipient.address}
                    onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2.5 glass rounded-lg dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    value={recipient.amount}
                    onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                    placeholder={isETH ? "0.01 ETH" : "10 USDC"}
                    className="w-full px-4 py-2.5 glass rounded-lg dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    required
                  />
                </div>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="p-2 glass rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="mt-4 p-4 glass rounded-xl border border-baseBlue/20">
            <p className="text-sm dark:text-gray-400 text-gray-600 mb-1">Total Amount:</p>
            <p className="text-2xl font-bold bg-base-gradient bg-clip-text text-transparent">
              {calculateTotal().toFixed(isETH ? 6 : 2)} {isETH ? 'ETH' : 'USDC'}
            </p>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">💌</span>
            Message (for all recipients)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Congratulations! You've won our giveaway..."
            rows={3}
            className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
          />
        </div>

        {/* Unlock Time */}
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">⏰</span>
            Unlock Time (optional)
          </label>
          <input
            type="datetime-local"
            value={unlockTime}
            onChange={(e) => setUnlockTime(e.target.value)}
            className="w-full px-5 py-3.5 glass rounded-xl dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading || approving || recipients.length === 0}
          className="w-full py-4 bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-baseBlue/50 active:scale-[0.98] text-lg"
          whileHover={{ scale: loading || approving ? 1 : 1.02 }}
          whileTap={{ scale: loading || approving ? 1 : 0.98 }}
        >
          {loading || approving
            ? '✨ Creating Gifts...'
            : `🎁 Create ${recipients.filter(r => r.address.trim() && r.amount.trim()).length} Gifts`}
        </motion.button>
      </form>
    </motion.div>
  );
}

