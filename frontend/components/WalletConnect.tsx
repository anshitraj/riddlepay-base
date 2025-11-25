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
    <rect x="4" y="9" width="3.5" height="9" />
    <rect x="16.5" y="9" width="3.5" height="9" />
    <rect x="4" y="7" width="16" height="2.5" />
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
  const {
    address,
    connectFarcaster,
    connectMetaMask,
    disconnect,
    isConnected,
    isConnecting,
    chainId,
    ensureBaseMainnet,
    isInMiniApp
  } = useWallet();

  const isBaseMainnet = chainId === 8453;

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">

        {/* Network Box */}
        <div className="flex items-center gap-2">
          {!isBaseMainnet && (
            <div className="px-3 py-2 glass rounded-xl border border-yellow-400/50">
              <span className="text-xs font-semibold text-yellow-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Wrong Network
              </span>
            </div>
          )}

          {isBaseMainnet && (
            <div className="px-3 py-2 glass rounded-xl border border-green-400/50">
              <span className="text-xs font-semibold text-green-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Base Mainnet
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

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!isBaseMainnet && (
            <button
              onClick={ensureBaseMainnet}
              className="px-4 py-3 min-h-[48px] bg-blue-600 text-white rounded-xl"
            >
              🌐 Switch to Base
            </button>
          )}

          <button
            onClick={disconnect}
            className="px-4 py-3 min-h-[48px] bg-red-600 text-white rounded-xl"
          >
            ✕ Disconnect
          </button>
        </div>
      </div>
    );
  }


  // -------------------------------
  // DUAL LOGIN BUTTONS (Farcaster + MetaMask/Base)
  // -------------------------------

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
      {/* Farcaster Login Button */}
      <button
        onClick={connectFarcaster}
        disabled={isConnecting}
        className="group relative w-full sm:min-w-[160px] px-5 py-3.5 min-h-[56px] bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/30 border border-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] opacity-90"></div>
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/40 to-pink-500/40 blur-xl -z-10 group-hover:opacity-75 transition-opacity"></div>
        
        <FarcasterLogo className="w-6 h-6 relative z-10 flex-shrink-0 drop-shadow-lg" />
        <span className="whitespace-nowrap relative z-10 text-sm sm:text-base font-semibold tracking-wide drop-shadow-sm">
          {isConnecting ? "Connecting..." : "Farcaster"}
        </span>
      </button>

      {/* MetaMask/Base Login Button */}
      <button
        onClick={connectMetaMask}
        disabled={isConnecting}
        className="group relative w-full sm:min-w-[160px] px-5 py-3.5 min-h-[56px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] opacity-90"></div>
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/40 to-cyan-500/40 blur-xl -z-10 group-hover:opacity-75 transition-opacity"></div>
        
        <BaseLogo className="w-6 h-6 relative z-10 flex-shrink-0 drop-shadow-lg" />
        <span className="whitespace-nowrap relative z-10 text-sm sm:text-base font-semibold tracking-wide drop-shadow-sm">
          {isConnecting ? "Connecting..." : "MetaMask"}
        </span>
      </button>
    </div>
  );
}
