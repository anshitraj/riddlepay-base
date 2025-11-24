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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Farcaster Login Button */}
      <button
        onClick={connectFarcaster}
        disabled={isConnecting}
        className="group relative w-full sm:min-w-[140px] px-4 py-3 min-h-[48px] bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 text-white font-bold rounded-xl shadow-lg border border-purple-400/20 disabled:opacity-50 hover:scale-105 transition-transform flex items-center justify-center"
      >
        <FarcasterLogo className="w-5 h-5 inline-block mr-2 flex-shrink-0" />
        <span className="whitespace-nowrap">{isConnecting ? "Connecting..." : "Farcaster"}</span>
      </button>

      {/* MetaMask/Base Login Button */}
      <button
        onClick={connectMetaMask}
        disabled={isConnecting}
        className="group relative w-full sm:min-w-[140px] px-4 py-3 min-h-[48px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg border border-blue-400/20 disabled:opacity-50 hover:scale-105 transition-transform flex items-center justify-center"
      >
        <BaseLogo className="w-5 h-5 inline-block mr-2 flex-shrink-0" />
        <span className="whitespace-nowrap">{isConnecting ? "Connecting..." : "MetaMask"}</span>
      </button>
    </div>
  );
}
