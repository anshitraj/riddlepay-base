import { WalletProvider } from '@/contexts/WalletContext';
import SendGiftForm from '@/components/SendGiftForm';
import WalletConnect from '@/components/WalletConnect';
import ThemeToggle from '@/components/ThemeToggle';
import Dashboard from '@/components/Dashboard';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-baseDark relative z-10 flex flex-col items-center">
        <div className="w-full max-w-6xl p-6">
          <div className="flex justify-end items-center gap-3 mb-8">
            <ThemeToggle />
            <WalletConnect />
          </div>
          
          <motion.header 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <h1 className="text-6xl md:text-7xl font-extrabold bg-base-gradient bg-clip-text text-transparent leading-tight">
                RiddlePay
              </h1>
              <motion.div 
                className="inline-block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-7xl">🎁</span>
              </motion.div>
            </div>
            <p className="text-xl md:text-2xl dark:text-gray-300 text-gray-700 font-light">
              Unlock crypto gifts with riddles
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm dark:text-gray-400 text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Powered by Base Network</span>
            </div>
          </motion.header>

          {/* Dashboard */}
          <div className="max-w-6xl mx-auto mb-12">
            <Dashboard />
          </div>

          <motion.div 
            className="max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SendGiftForm />
          </motion.div>

          <motion.div 
            className="text-center flex items-center justify-center gap-4 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Link
              href="/my-gifts"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-baseLight/50 dark:bg-white/80 rounded-xl text-white dark:text-gray-900 font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-baseBlue/20 border border-baseBlue/20 dark:border-gray-200"
            >
              <span>View My Gifts</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/leaderboard"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-baseLight/50 dark:bg-white/80 rounded-xl text-white dark:text-gray-900 font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-baseBlue/20 border border-baseBlue/20 dark:border-gray-200"
            >
              <span>🏆 Leaderboard</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </WalletProvider>
  );
}

