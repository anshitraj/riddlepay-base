'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import SendGiftForm from '@/components/SendGiftForm';
import LandingPage from '@/components/LandingPage';
import { motion } from 'framer-motion';

function HomeContent() {
  const { isConnected } = useWallet();
  const [hasLaunchedBefore, setHasLaunchedBefore] = useState(false);

  // Check on mount if user has launched dashboard before
  useEffect(() => {
    const launched = sessionStorage.getItem('dappLaunched') === 'true';
    setHasLaunchedBefore(launched);
  }, []);

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
    <div className="min-h-screen bg-baseDark flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-60">
        {/* Header */}
        <Header />

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Dashboard Stats */}
            <Dashboard />

            {/* Send Gift Form */}
            <motion.div 
              className="glass rounded-2xl p-4 sm:p-6 md:p-8 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-4 sm:mb-6">
                <div className="mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-gray-900">
                      Create New Crypto Airdrop
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 mt-1">
                      Send a secure, on-chain airdrop with an optional riddle and personal message.
                    </p>
                </div>
                {/* Light gradient separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-600 dark:via-gray-700 to-transparent mt-4"></div>
              </div>
              <SendGiftForm />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
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

