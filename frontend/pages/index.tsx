'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import LandingPage from '@/components/LandingPage';
import OnboardingModal from '@/components/OnboardingModal';
import BottomNav from '@/components/BottomNav';
import { useNotifications } from '@/hooks/useNotifications';
import { useStatsPreview } from '@/hooks/useStatsPreview';
import { ArrowUpRight } from 'lucide-react';
import AddToFarcasterBanner from '@/components/AddToFarcasterBanner';

// Dynamically import heavy components to reduce initial bundle size
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 border border-border animate-pulse">
            <div className="h-8 bg-gray-700/30 rounded w-1/2 mb-4"></div>
            <div className="h-12 bg-gray-700/30 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  ),
  ssr: false,
});

const SendGiftForm = dynamic(() => import('@/components/SendGiftForm'), {
  loading: () => (
    <div className="glass rounded-2xl p-6 border border-border animate-pulse">
      <div className="h-8 bg-gray-700/30 rounded w-1/2 mb-4"></div>
      <div className="h-32 bg-gray-700/30 rounded"></div>
    </div>
  ),
});

function HomeContent() {
  const { isConnected, connect, address } = useWallet();
  const [isStable, setIsStable] = useState(false);
  
  // Enable notifications when user is connected
  useNotifications();
  
  // Get stats preview data
  const { stats: previewStats, loading: statsLoading } = useStatsPreview();
  
  const [hasLaunchedBefore, setHasLaunchedBefore] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  // Check if running in Farcaster
  const isFarcaster = () => {
    try {
      if (typeof window === 'undefined') return false;
      return (
        window.location?.href?.includes('farcaster.xyz') || 
        window.location?.href?.includes('warpcast.com') ||
        !!(window as any).farcaster ||
        !!(window as any).parent?.farcaster
      );
    } catch (error) {
      console.error('Error checking Farcaster environment:', error);
      return false;
    }
  };

  // Handle scroll to airdrop form when hash is present
  useEffect(() => {
    const handleHashScroll = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#create-airdrop-form') {
        setTimeout(() => {
          const element = document.getElementById('create-airdrop-form');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Remove hash from URL after scrolling
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 300);
      }
    };

    // Check on initial load
    handleHashScroll();

    // Also listen for hash changes
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  // Stabilize connection state to prevent flickering (optimized for faster loading)
  useEffect(() => {
    // Use microtask for immediate execution without blocking
    Promise.resolve().then(() => {
      setIsStable(true);
    });
  }, [address]);

  // Check launch state and show onboarding
  useEffect(() => {
    try {
      const launched = sessionStorage.getItem('dappLaunched') === 'true';
      setHasLaunchedBefore(launched);
      
      // Show onboarding if not completed and not marked as "don't show"
      if (isConnected && !localStorage.getItem('onboarding_completed') && !localStorage.getItem('onboarding_dont_show')) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Use stable connection state to prevent flickering
  // Only show landing page if we're stable AND not connected
  // If not stable yet, show landing page (prevents flash of dashboard)
  const stableIsConnected = isStable && isConnected;

  const handleLaunchDApp = () => {
    setHasLaunchedBefore(true);
    sessionStorage.setItem('dappLaunched', 'true');
  };

  // Show landing page if wallet is not connected (use stable state to prevent flickering)
  // Always show landing page first, let user explore and then connect manually
  if (!stableIsConnected) {
    return <LandingPage onLaunchDApp={handleLaunchDApp} />;
  }

  // Show dashboard if wallet is connected
  return (
    <>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <div className="min-h-screen bg-baseDark flex pb-16 lg:pb-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-60 w-full min-w-0">
          {/* Header */}
          <Header />

          {/* Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto w-full bg-gradient-to-b from-[#0A0F1F] to-[#0E152B] dark:from-[#0A0F1F] dark:to-[#0E152B] from-gray-50 to-gray-100 dark:from-[#0A0F1F] dark:to-[#0E152B] overscroll-contain touch-action-pan-y">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 w-full">
              {/* Add to Farcaster Banner */}
              <AddToFarcasterBanner />

              {/* Stats Preview Row */}
              <div className="bg-[#0E152B]/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#0066FF]/10">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">TVL Change</span>
                    {statsLoading ? (
                      <span className="text-sm sm:text-base text-gray-500 font-semibold">Loading...</span>
                    ) : (
                      <span className={`text-sm sm:text-base font-semibold flex items-center gap-1 ${
                        previewStats.tvlChange >= 0 ? 'text-green-400' : previewStats.tvlChange < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {previewStats.tvlChange !== 0 && (
                          previewStats.tvlChange >= 0 ? (
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                          )
                        )}
                        {previewStats.tvlChange >= 0 && previewStats.tvlChange !== 0 ? '+' : ''}{previewStats.tvlChange.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-[#0066FF]/20"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">Claims Today</span>
                    {statsLoading ? (
                      <span className="text-sm sm:text-base text-gray-500 font-semibold">Loading...</span>
                    ) : (
                      <span className="text-sm sm:text-base text-white dark:text-white text-gray-900 dark:text-white font-semibold">{previewStats.claimsToday ?? 0}</span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-[#0066FF]/20"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400">Riddle Solves</span>
                    {statsLoading ? (
                      <span className="text-sm sm:text-base text-gray-500 font-semibold">Loading...</span>
                    ) : (
                      <span className="text-sm sm:text-base text-white dark:text-white text-gray-900 dark:text-white font-semibold">{previewStats.riddleSolves ?? 0}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dashboard Stats */}
              <Dashboard />

              {/* Send Gift Form */}
              <div
                id="create-airdrop-form"
                className="bg-[#0E152B]/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 border border-[#0066FF]/10 shadow-xl w-full"
              >
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className="mb-2 sm:mb-3">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white dark:text-white text-gray-900 dark:text-white leading-tight">
                        Create New Crypto Airdrop
                      </h2>
                      <p className="text-xs sm:text-sm md:text-base text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mt-2 leading-tight">
                        Send a secure, on-chain airdrop with an optional riddle and personal message.
                      </p>
                  </div>
                  {/* Light gradient separator */}
                  <div className="h-px bg-gradient-to-r from-transparent via-[#0066FF]/30 to-transparent mt-3 sm:mt-4"></div>
                </div>
                <SendGiftForm />
              </div>

              {/* How To Use Mini Card */}
              <div>
                <button
                  onClick={handleShowOnboarding}
                  className="w-full bg-[#0E152B]/50 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-[#0066FF]/10 hover:border-[#0066FF]/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <span className="text-xl">ℹ️</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
                        How RiddlePay Works
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Learn how to send and claim secret airdrops
                      </p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </button>
              </div>
            </div>
          </main>
        </div>
        
        {/* Bottom Navigation for Mobile */}
        <BottomNav />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <SearchProviderWrapper>
      <HomeContent />
    </SearchProviderWrapper>
  );
}

