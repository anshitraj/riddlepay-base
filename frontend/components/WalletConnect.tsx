'use client';

import { useWallet } from '@/contexts/WalletContext';

export default function WalletConnect() {
  const { address, connect, disconnect, switchWallet, isConnected, chainId, ensureBaseMainnet } = useWallet();
  const isBaseMainnet = chainId === 8453;
  const isCorrectNetwork = isBaseMainnet;

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Network Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isCorrectNetwork && (
            <div className="px-3 py-2 glass rounded-xl border border-yellow-400/50">
              <span className="text-xs font-semibold text-yellow-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">Wrong Network</span>
                <span className="sm:hidden">Wrong Net</span>
              </span>
            </div>
          )}
          {isBaseMainnet && (
            <div className="px-3 py-2 glass rounded-xl border border-green-400/50">
              <span className="text-xs font-semibold text-green-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">Base Mainnet</span>
                <span className="sm:hidden">Mainnet</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Address */}
        <div className="px-4 py-2.5 glass-strong rounded-xl border border-border min-h-[44px] flex items-center">
          <span className="text-sm font-mono dark:text-white text-gray-900 font-semibold">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={switchWallet}
            className="px-4 py-2.5 min-h-[44px] glass rounded-xl dark:text-white text-gray-900 text-sm font-medium transition-all duration-200 active:scale-95 border border-border touch-manipulation"
            title="Switch to a different wallet account"
          >
            <span className="hidden sm:inline">🔄 Switch</span>
            <span className="sm:hidden">🔄</span>
          </button>
          {!isCorrectNetwork && (
            <button
              onClick={ensureBaseMainnet}
              className="px-4 py-2.5 min-h-[44px] bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-blue-500/50 text-sm font-semibold touch-manipulation"
            >
              <span className="hidden sm:inline">🌐 Switch to Base Mainnet</span>
              <span className="sm:hidden">🌐 Switch</span>
            </button>
          )}
          <button
            onClick={disconnect}
            className="px-4 py-2.5 min-h-[44px] bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-red-500/50 text-sm font-semibold touch-manipulation"
          >
            <span className="hidden sm:inline">✕ Disconnect</span>
            <span className="sm:hidden">✕</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="w-full sm:w-auto px-6 sm:px-8 py-3 min-h-[44px] bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl transition-all duration-300 active:scale-95 hover:shadow-lg hover:shadow-blue-500/50 touch-manipulation text-sm sm:text-base"
    >
      <span className="hidden sm:inline">🔌 Connect Wallet</span>
      <span className="sm:hidden">🔌 Connect</span>
    </button>
  );
}

