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
  const { connect, isConnecting, isInMiniApp } = useWallet();

  const handleLogin = async () => {
    try {
      await connect();
      onClose();
    } catch (err) {
      console.error('Failed to connect:', err);
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
            {isInMiniApp 
              ? 'Connect your Farcaster wallet to continue'
              : 'Connect your wallet to continue'}
          </p>
          
          <button
            onClick={handleLogin}
            disabled={isConnecting}
            className="w-full p-4 min-h-[60px] bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-blue-400/30 shadow-sm"
          >
            {isInMiniApp ? (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="9" width="3.5" height="9" />
                  <rect x="16.5" y="9" width="3.5" height="9" />
                  <rect x="4" y="7" width="16" height="2.5" />
                  <path d="M7.5 7 Q12 12 16.5 7" stroke="currentColor" strokeWidth="2.5" fill="none" />
                </svg>
                <span>{isConnecting ? 'Connecting...' : 'Login with Farcaster'}</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                </svg>
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

