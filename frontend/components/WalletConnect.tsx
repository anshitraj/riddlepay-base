'use client';

import { useWallet } from '@/contexts/WalletContext';

export default function WalletConnect() {
  const { address, connect, disconnect, switchWallet, isConnected, chainId, ensureBaseSepolia, ensureBaseMainnet } = useWallet();
  const isBaseSepolia = chainId === 84532;
  const isBaseMainnet = chainId === 8453;
  const isCorrectNetwork = isBaseSepolia || isBaseMainnet;
  
  // Prioritize Base Mainnet for production - show correct network name
  const displayNetwork = isBaseMainnet ? 'Base Mainnet' : isBaseSepolia ? 'Base Sepolia' : 'Unknown Network';
  
  // Debug: Log chainId to help troubleshoot
  if (typeof window !== 'undefined' && chainId) {
    console.log('Current chainId:', chainId, 'isBaseSepolia:', isBaseSepolia, 'isBaseMainnet:', isBaseMainnet);
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {!isCorrectNetwork && (
          <div className="px-4 py-2 glass rounded-xl border border-yellow-400/50">
            <span className="text-xs font-semibold text-yellow-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Wrong Network
            </span>
          </div>
        )}
        {(isBaseMainnet || isBaseSepolia) && (
          <div className="px-4 py-2 glass rounded-xl border border-green-400/50">
            <span className="text-xs font-semibold text-green-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {displayNetwork}
            </span>
          </div>
        )}
        <div className="px-5 py-2.5 glass-strong rounded-xl border border-border">
          <span className="text-sm font-mono dark:text-white text-gray-900 font-semibold">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={switchWallet}
          className="px-4 py-2.5 glass rounded-xl dark:text-white text-gray-900 text-sm font-medium transition-all duration-200 hover:scale-105 border border-border"
          title="Switch to a different wallet account"
        >
          🔄 Switch
        </button>
        {!isCorrectNetwork && (
          <button
            onClick={ensureBaseMainnet}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 text-sm font-semibold"
          >
            🌐 Switch to Base Mainnet
          </button>
        )}
        <button
          onClick={disconnect}
          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 text-sm font-semibold"
        >
          ✕ Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95"
    >
      🔌 Connect Wallet
    </button>
  );
}

