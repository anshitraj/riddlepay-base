'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import toast from 'react-hot-toast';
import { Plus, X, Users, AlertCircle, Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { addXP, getUserXP } from '@/utils/xpSystem';

// Farcaster Logo SVG Component
const FarcasterLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="4" y="9" width="3.5" height="9" />
    <rect x="16.5" y="9" width="3.5" height="9" />
    <rect x="4" y="7" width="16" height="2.5" />
    <path d="M7.5 7 Q12 12 16.5 7" stroke="currentColor" strokeWidth="2.5" fill="none" />
  </svg>
);

// Base Logo SVG Component
const BaseLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);

interface Recipient {
  address: string;
  amount: string;
}

export default function BulkGiveawayForm() {
  const { address, ensureBaseMainnet, connectFarcaster, connectBase } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const { createBulkGifts, loading, error, approving } = useContract();
  
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', amount: '' }
  ]);
  const [message, setMessage] = useState('');
  const [isETH, setIsETH] = useState(false); // Default to USDC for bulk
  const [unlockTime, setUnlockTime] = useState('');
  const [expirationTime, setExpirationTime] = useState('7days'); // Default: 7 days
  const [customExpirationHours, setCustomExpirationHours] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);

    // Read and parse CSV
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedRecipients: Recipient[] = [];
          const errors: string[] = [];

          results.data.forEach((row: any, index: number) => {
            // Skip header row if it exists
            if (index === 0 && (row[0]?.toLowerCase().includes('address') || row[0]?.toLowerCase().includes('wallet'))) {
              return;
            }

            const address = (row[0] || '').trim();
            const amount = (row[1] || '').trim();

            // Validate address
            if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
              errors.push(`Row ${index + 1}: Invalid address "${address}"`);
              return;
            }

            // Validate amount
            const amountNum = parseFloat(amount);
            if (!amount || isNaN(amountNum) || amountNum <= 0) {
              errors.push(`Row ${index + 1}: Invalid amount "${amount}"`);
              return;
            }

            parsedRecipients.push({ address, amount });
          });

          if (errors.length > 0) {
            toast.error(`CSV parsing errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}`);
          }

          if (parsedRecipients.length === 0) {
            toast.error('No valid recipients found in CSV');
            return;
          }

          if (parsedRecipients.length > 100) {
            toast.error('CSV contains more than 100 recipients. Only the first 100 will be used.');
            setRecipients(parsedRecipients.slice(0, 100));
          } else {
            setRecipients(parsedRecipients);
          }

          toast.success(`Loaded ${parsedRecipients.length} recipient(s) from CSV`);
        } catch (error: any) {
          console.error('Error parsing CSV:', error);
          toast.error('Failed to parse CSV file. Please check the format.');
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error('Failed to read CSV file');
      },
    });
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

    const loadingToast = toast.loading(`Creating ${validRecipients.length} airdrops...`);

    try {
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

      const receivers = validRecipients.map(r => r.address);
      const amounts = validRecipients.map(r => r.amount);

      const hash = await createBulkGifts(receivers, amounts, isETH, message, unlockTimestamp, expirationTimestamp);
      setTxHash(hash);
      setSuccess(true);
      
      toast.dismiss(loadingToast);
      
      // Award XP for bulk send
      if (address) {
        const currentXP = getUserXP(address);
        const newXP = addXP(address, 'bulk_send', false);
        const xpEarned = newXP - currentXP;
        toast.success(`${validRecipients.length} Airdrops Created! 🎁 +${xpEarned} XP earned! ⭐`, {
          duration: 5000,
        });
      } else {
        toast.success(`${validRecipients.length} Airdrops Created! 🎁`, {
          duration: 5000,
        });
      }

      // Reset form after 5 seconds
      setTimeout(() => {
        setRecipients([{ address: '', amount: '' }]);
        setMessage('');
        setUnlockTime('');
        setExpirationTime('7days');
        setCustomExpirationHours('');
        setSuccess(false);
        setTxHash('');
      }, 5000);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to create bulk airdrops 😅');
      console.error('Error creating bulk airdrops:', err);
    }
  };

  const calculateTotal = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleLoginWithFarcaster = async () => {
    setIsConnecting(true);
    try {
      await connectFarcaster();
    } catch (err) {
      console.error('Failed to connect to Farcaster:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoginWithBase = async () => {
    setIsConnecting(true);
    try {
      await connectBase();
    } catch (err) {
      console.error('Failed to connect to Base:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-white dark:bg-baseLight/50 rounded-xl p-8 sm:p-12 text-center border border-gray-200 dark:border-blue-500/20 shadow-sm">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-[#1e293b] dark:text-gray-300 text-lg mb-6">Please connect your wallet to create bulk giveaways</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={handleLoginWithFarcaster}
            disabled={isConnecting}
            className="w-full sm:w-auto group relative flex-shrink-0 min-w-[160px] px-6 py-3 min-h-[56px] bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 text-white font-bold rounded-xl transition-all duration-300 active:scale-[0.97] hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(147,51,234,0.4)] touch-manipulation text-sm flex flex-row items-center justify-center gap-3 shadow-lg shadow-purple-500/30 border border-purple-400/20 hover:border-purple-300/40 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/30 to-purple-600/30 blur-xl -z-10"></div>
            <FarcasterLogo className="w-5 h-5 relative z-10 text-white flex-shrink-0" />
            <span className="text-center leading-tight relative z-10 font-semibold tracking-wide whitespace-nowrap text-white">
              {isConnecting ? 'Connecting...' : 'Login with Farcaster'}
            </span>
          </button>

          <button
            onClick={handleLoginWithBase}
            disabled={isConnecting}
            className="w-full sm:w-auto group relative flex-shrink-0 min-w-[160px] px-6 py-3 min-h-[56px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white font-bold rounded-xl transition-all duration-300 active:scale-[0.97] hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,82,255,0.4)] touch-manipulation text-sm flex flex-row items-center justify-center gap-3 shadow-lg shadow-blue-500/30 border border-blue-400/20 hover:border-blue-300/40 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-xl -z-10"></div>
            <BaseLogo className="w-5 h-5 relative z-10 text-white flex-shrink-0" />
            <span className="text-center leading-tight relative z-10 font-semibold tracking-wide whitespace-nowrap text-white">
              {isConnecting ? 'Connecting...' : 'Login with Base'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-baseLight/50 rounded-xl p-4 border border-gray-200 dark:border-blue-500/20 shadow-sm mb-24 lg:mb-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-blue-500/30">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-base-gradient bg-clip-text text-transparent">
          Bulk Giveaway
        </h2>
      </div>
      
      {success && (
        <div className="mb-6 p-5 bg-green-500/10 border border-green-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-500 dark:text-green-400 font-semibold text-lg">Bulk airdrops created successfully!</p>
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

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Token Type */}
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="text-blue-500">💰</span>
            Token Type
          </label>
          <div className="flex gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsETH(false)}
              className={`flex-1 py-3 px-4 min-h-[44px] rounded-xl font-semibold transition-all duration-200 active:scale-95 touch-manipulation ${
                !isETH
                  ? 'bg-base-gradient text-white shadow-lg shadow-blue-500/30'
                  : 'glass dark:text-white text-gray-900 border border-border'
              }`}
            >
              USDC
            </button>
            <button
              type="button"
              onClick={() => setIsETH(true)}
              className={`flex-1 py-3 px-4 min-h-[44px] rounded-xl font-semibold transition-all duration-200 active:scale-95 touch-manipulation ${
                isETH
                  ? 'bg-base-gradient text-white shadow-lg shadow-blue-500/30'
                  : 'glass dark:text-white text-gray-900 border border-border'
              }`}
            >
              ETH
            </button>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <label className="block text-sm font-semibold dark:text-white text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">👥</span>
              Recipients ({recipients.length}/100)
            </label>
            <div className="flex gap-2">
              <label className="px-3 sm:px-4 py-2 min-h-[44px] bg-white dark:glass rounded-xl border border-gray-200 dark:border-blue-500/20 text-[#0f172a] dark:text-white text-sm font-medium transition-colors duration-75 flex items-center gap-2 touch-manipulation cursor-pointer hover:bg-gray-50 dark:hover:bg-blue-500/10">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload CSV</span>
                <span className="sm:hidden">CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={addRecipient}
                className="px-3 sm:px-4 py-2 min-h-[44px] bg-white dark:glass rounded-xl border border-gray-200 dark:border-blue-500/20 text-[#0f172a] dark:text-white text-sm font-medium transition-colors duration-75 flex items-center gap-2 touch-manipulation hover:bg-gray-50 dark:hover:bg-blue-500/10"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Recipient</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
          {csvFile && (
            <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-400">{csvFile.name}</span>
            </div>
          )}
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {recipients.map((recipient, index) => (
              <div
                key={index}
                className="flex gap-3 items-start p-4 bg-white dark:glass rounded-xl border border-gray-200 dark:border-border"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={recipient.address}
                    onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 sm:px-4 py-2.5 min-h-[44px] text-base bg-white dark:glass rounded-lg border border-gray-200 dark:border-border text-[#1e293b] dark:text-white placeholder-[#9ca3af] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all touch-manipulation"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    value={recipient.amount}
                    onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                    placeholder={isETH ? "0.01 ETH" : "10 USDC"}
                    className="w-full px-3 sm:px-4 py-2.5 min-h-[44px] text-base bg-white dark:glass rounded-lg border border-gray-200 dark:border-border text-[#1e293b] dark:text-white placeholder-[#9ca3af] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all touch-manipulation"
                    required
                  />
                </div>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="p-2 min-w-[44px] min-h-[44px] bg-white dark:glass rounded-lg border border-gray-200 dark:border-red-500/20 text-red-600 dark:text-red-500 hover:bg-gray-50 dark:hover:bg-red-500/10 transition-colors duration-75 touch-manipulation flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-white dark:glass rounded-xl border border-gray-200 dark:border-blue-500/20">
            <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-1">Total Amount:</p>
            <p className="text-2xl font-bold text-[#1e293b] dark:text-white">
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
            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 text-base bg-white dark:glass rounded-xl border border-gray-200 dark:border-border text-[#1e293b] dark:text-white placeholder-[#9ca3af] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-75 resize-none touch-manipulation"
          />
        </div>

        {/* Unlock Day */}
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-500">⏰</span>
            Unlock Day (optional)
          </label>
          <input
            type="date"
            value={unlockTime}
            onChange={(e) => setUnlockTime(e.target.value)}
            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 min-h-[44px] text-base bg-white dark:glass rounded-xl border border-gray-200 dark:border-border text-[#1e293b] dark:text-white placeholder-[#9ca3af] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-75 touch-manipulation"
          />
        </div>

        {/* Expiration Time */}
        <div>
          <label className="block text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            Expiration Time <span className="text-xs text-gray-500 dark:text-gray-500 font-normal">(Auto-refund if not claimed)</span>
          </label>
          <div className="space-y-3">
            <select
              value={expirationTime}
              onChange={(e) => setExpirationTime(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 min-h-[44px] text-base bg-white dark:glass rounded-xl border border-gray-200 dark:border-border text-[#1e293b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-75 cursor-pointer touch-manipulation"
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
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 min-h-[44px] text-base bg-white dark:glass rounded-xl border border-gray-200 dark:border-border text-[#1e293b] dark:text-white placeholder-[#9ca3af] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-75 touch-manipulation"
                />
                {customExpirationHours && (
                  <p className="mt-2 text-xs dark:text-gray-400 text-gray-600">
                    Airdrops will expire in: {Number(customExpirationHours) >= 24 
                      ? `${(Number(customExpirationHours) / 24).toFixed(1)} days`
                      : `${customExpirationHours} hours`}
                  </p>
                )}
              </div>
            )}
            {expirationTime !== 'custom' && (
              <p className="text-xs dark:text-gray-400 text-gray-600">
                {expirationTime === '24hours' && 'Airdrops will expire in 24 hours if not claimed'}
                {expirationTime === '7days' && 'Airdrops will expire in 7 days if not claimed'}
                {expirationTime === '1month' && 'Airdrops will expire in 30 days if not claimed'}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || approving || recipients.length === 0}
          className="w-full py-4 min-h-[52px] bg-[#eef2ff] dark:bg-base-gradient text-[#4f6ef7] dark:text-white font-semibold rounded-xl border border-[#dce2ff] dark:border-transparent hover:bg-[#e4e8ff] dark:hover:opacity-90 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed text-base touch-manipulation shadow-sm dark:shadow-md mb-6"
        >
          {loading || approving
            ? '✨ Creating Airdrops...'
            : `🎁 Create ${recipients.filter(r => r.address.trim() && r.amount.trim()).length} Airdrops`}
        </button>
      </form>
    </div>
  );
}

