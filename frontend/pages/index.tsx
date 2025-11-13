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
import { motion } from 'framer-motion';

function HomeContent() {
  const { isConnected } = useWallet();
  
  // Enable notifications when user is connected
  useNotifications();
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
        <div className="flex-1 flex flex-col lg:ml-60">
          {/* Header */}
          <Header />

          {/* Content */}
          <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Dashboard Stats */}
              <Dashboard />

              {/* What is RiddlePay Link */}
              <div className="flex justify-center">
                <button
                  onClick={handleShowOnboarding}
                  className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 dark:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors touch-manipulation min-h-[44px] px-3"
                >
                  <span>ℹ️</span>
                  <span>What is RiddlePay?</span>
                </button>
              </div>

              {/* Send Gift Form */}
              <motion.div 
                className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-3 sm:mb-4 md:mb-6">
                  <div className="mb-2">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-gray-900">
                        Create New Crypto Airdrop
                      </h2>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 dark:text-gray-600 mt-1">
                        Send a secure, on-chain airdrop with an optional riddle and personal message.
                      </p>
                  </div>
                  {/* Light gradient separator */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600 dark:via-gray-700 to-transparent mt-3 sm:mt-4"></div>
                </div>
                <SendGiftForm />
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

