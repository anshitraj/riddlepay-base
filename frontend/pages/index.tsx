'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import SendGiftForm from '@/components/SendGiftForm';
import LandingPage from '@/components/LandingPage';
import OnboardingModal from '@/components/OnboardingModal';
import BottomNav from '@/components/BottomNav';
import { useNotifications } from '@/hooks/useNotifications';
import { useStatsPreview } from '@/hooks/useStatsPreview';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Send, ArrowUpRight } from 'lucide-react';

function HomeContent() {
  const { isConnected } = useWallet();
  
  // Enable notifications when user is connected
  useNotifications();
  
  // Get stats preview data
  const { stats: previewStats, loading: statsLoading } = useStatsPreview();
  
  const [hasLaunchedBefore, setHasLaunchedBefore] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  // Check on mount if user has launched dashboard before
  useEffect(() => {
    const launched = sessionStorage.getItem('dappLaunched') === 'true';
    setHasLaunchedBefore(launched);
    
    // Show onboarding if not completed and not marked as "don't show"
    if (isConnected && !localStorage.getItem('onboarding_completed') && !localStorage.getItem('onboarding_dont_show')) {
      setShowOnboarding(true);
    }
  }, [isConnected]);

  const handleLaunchDApp = () => {
    setHasLaunchedBefore(true);
    sessionStorage.setItem('dappLaunched', 'true');
  };

  // Show landing page if wallet is not connected
  // This ensures landing page shows whenever user visits without a connected wallet
  if (!isConnected) {
    // If user has launched before, they might want to see dashboard even without wallet
    // But for better UX, show landing page to encourage reconnection
    return <LandingPage onLaunchDApp={handleLaunchDApp} />;
  }

  // Show dashboard if wallet is connected or dashboard has been launched
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
          <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto w-full bg-gradient-to-b from-[#0A0F1F] to-[#0E152B]">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 w-full">
              {/* Big Center CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center"
              >
                <Link href="/" prefetch={true}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#0052FF] to-[#00C2FF] rounded-2xl sm:rounded-3xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-3 group"
                  >
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform" />
                    <span className="text-base sm:text-lg md:text-xl font-bold text-white">
                      Create Secret Airdrop
                    </span>
                    <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </motion.button>
                </Link>
              </motion.div>

              {/* Stats Preview Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#0E152B]/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#0066FF]/10"
              >
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-xs sm:text-sm text-gray-400">TVL Change</span>
                    {statsLoading ? (
                      <span className="text-sm sm:text-base text-gray-500 font-semibold">...</span>
                    ) : (
                      <span className={`text-sm sm:text-base font-semibold flex items-center gap-1 ${
                        previewStats.tvlChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {previewStats.tvlChange >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                        )}
                        {previewStats.tvlChange >= 0 ? '+' : ''}{previewStats.tvlChange.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-[#0066FF]/20"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs sm:text-sm text-gray-400">Claims Today</span>
                    {statsLoading ? (
                      <span className="text-sm sm:text-base text-gray-500 font-semibold">...</span>
                    ) : (
                      <span className="text-sm sm:text-base text-white font-semibold">{previewStats.claimsToday}</span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-[#0066FF]/20"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    <span className="text-xs sm:text-sm text-gray-400">Riddle Solves</span>
                    {statsLoading ? (
                      <span className="text-sm sm:text-base text-gray-500 font-semibold">...</span>
                    ) : (
                      <span className="text-sm sm:text-base text-white font-semibold">{previewStats.riddleSolves}</span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Dashboard Stats */}
              <Dashboard />

              {/* Send Gift Form */}
              <motion.div 
                className="bg-[#0E152B]/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 border border-[#0066FF]/10 shadow-xl w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className="mb-2 sm:mb-3">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                        Create New Crypto Airdrop
                      </h2>
                      <p className="text-xs sm:text-sm md:text-base text-gray-400 mt-2 leading-tight">
                        Send a secure, on-chain airdrop with an optional riddle and personal message.
                      </p>
                  </div>
                  {/* Light gradient separator */}
                  <div className="h-px bg-gradient-to-r from-transparent via-[#0066FF]/30 to-transparent mt-3 sm:mt-4"></div>
                </div>
                <SendGiftForm />
              </motion.div>

              {/* How To Use Mini Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
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
              </motion.div>
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
    <WalletProvider>
      <SearchProviderWrapper>
        <HomeContent />
      </SearchProviderWrapper>
    </WalletProvider>
  );
}

