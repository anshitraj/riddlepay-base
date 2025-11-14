'use client';

import { useWallet } from '@/contexts/WalletContext';

// Farcaster Logo SVG Component (Archway/Gateway Design)
const FarcasterLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Left Pillar */}
    <rect x="4" y="9" width="3.5" height="9" />
    {/* Right Pillar */}
    <rect x="16.5" y="9" width="3.5" height="9" />
    {/* Top Horizontal Beam */}
    <rect x="4" y="7" width="16" height="2.5" />
    {/* Arch Curve - Semi-circular opening */}
    <path d="M7.5 7 Q12 12 16.5 7" stroke="currentColor" strokeWidth="2.5" fill="none" />
  </svg>
);

// Base Logo SVG Component (Rounded Square)
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

export default function WalletConnect() {
  const { address, connect, connectFarcaster, connectBase, disconnect, switchWallet, isConnected, chainId, ensureBaseMainnet } = useWallet();
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={switchWallet}
            className="w-full sm:w-auto px-4 sm:px-4 py-3 min-h-[48px] glass rounded-xl dark:text-white text-gray-900 text-sm sm:text-sm font-medium transition-all duration-200 active:scale-[0.98] border border-border touch-manipulation flex items-center justify-center gap-2"
            title="Switch to a different wallet account"
          >
            <span className="text-base">🔄</span>
            <span>Switch Wallet</span>
          </button>
          {!isCorrectNetwork && (
            <button
              onClick={ensureBaseMainnet}
              className="w-full sm:w-auto px-4 sm:px-4 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:shadow-blue-500/50 text-sm font-semibold touch-manipulation flex items-center justify-center gap-2"
            >
              <span className="text-base">🌐</span>
              <span className="hidden sm:inline">Switch to Base Mainnet</span>
              <span className="sm:hidden">Switch Network</span>
            </button>
          )}
          <button
            onClick={disconnect}
            className="w-full sm:w-auto px-4 sm:px-4 py-3 min-h-[48px] bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:shadow-red-500/50 text-sm font-semibold touch-manipulation flex items-center justify-center gap-2"
          >
            <span className="text-base">✕</span>
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-3 flex-wrap sm:flex-nowrap w-full max-w-2xl">
      {/* Farcaster Button - Base Official Style */}
      <button
        onClick={connectFarcaster}
        className="group relative flex-1 min-w-0 px-6 py-3 min-h-[60px] sm:min-h-[70px] bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 text-white font-bold rounded-2xl transition-all duration-300 active:scale-[0.97] hover:scale-[1.03] hover:shadow-[0_4px_20px_rgba(147,51,234,0.4)] touch-manipulation text-xs sm:text-base flex flex-row items-center justify-center gap-3 shadow-lg shadow-purple-500/30 border border-purple-400/20 hover:border-purple-300/40 backdrop-blur-md"
      >
        {/* Light glow behind button */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/30 to-purple-600/30 blur-xl -z-10"></div>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <FarcasterLogo className="w-5 h-5 sm:w-7 sm:h-7 relative z-10 text-white flex-shrink-0" />
        <span className="text-center leading-tight relative z-10 font-semibold tracking-wide whitespace-nowrap">Login with Farcaster</span>
      </button>
      
      {/* Base Button - Base Official Style */}
      <button
        onClick={connectBase}
        className="group relative flex-1 min-w-0 px-6 py-3 min-h-[60px] sm:min-h-[70px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white font-bold rounded-2xl transition-all duration-300 active:scale-[0.97] hover:scale-[1.03] hover:shadow-[0_4px_20px_rgba(0,82,255,0.4)] touch-manipulation text-xs sm:text-base flex flex-row items-center justify-center gap-3 shadow-lg shadow-blue-500/30 border border-blue-400/20 hover:border-blue-300/40 backdrop-blur-md"
      >
        {/* Light glow behind button */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-xl -z-10"></div>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <BaseLogo className="w-5 h-5 sm:w-7 sm:h-7 relative z-10 text-white flex-shrink-0" />
        <span className="text-center leading-tight relative z-10 font-semibold tracking-wide whitespace-nowrap">Login with Base</span>
      </button>
    </div>
  );
}

