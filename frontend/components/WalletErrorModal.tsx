'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface WalletErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string;
}

export default function WalletErrorModal({ isOpen, onClose, error }: WalletErrorModalProps) {
  const { connectFarcaster, connectBase } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLoginWithFarcaster = async () => {
    setIsConnecting(true);
    try {
      await connectFarcaster();
      onClose();
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
      onClose();
    } catch (err) {
      console.error('Failed to connect to Base:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#0E152B]/95 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-blue-500/20 shadow-lg relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[#0f172a] dark:text-white">
            Connect Wallet
          </h3>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-red-500/20 hover:bg-gray-200 dark:hover:bg-red-500/30 rounded-lg transition-colors duration-75 flex items-center justify-center border border-gray-200 dark:border-red-500/30"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#1e293b] dark:text-red-400" />
          </button>
        </div>


        <div className="mb-6">
          <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-4">
            Choose your preferred wallet to connect:
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleLoginWithFarcaster}
              disabled={isConnecting}
              className="w-full p-4 min-h-[60px] bg-[#8A63D2] hover:bg-[#7a53c2] text-white font-semibold rounded-xl transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-[#8A63D2]/30 shadow-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="9" width="3.5" height="9" />
                <rect x="16.5" y="9" width="3.5" height="9" />
                <rect x="4" y="7" width="16" height="2.5" />
                <path d="M7.5 7 Q12 12 16.5 7" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>
              <span>{isConnecting ? 'Connecting...' : 'Login with Farcaster'}</span>
            </button>

            <button
              onClick={handleLoginWithBase}
              disabled={isConnecting}
              className="w-full p-4 min-h-[60px] bg-[#0052FF] hover:bg-[#0042cc] text-white font-semibold rounded-xl transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-[#0052FF]/30 shadow-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
              <span>{isConnecting ? 'Connecting...' : 'Login with Base'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

