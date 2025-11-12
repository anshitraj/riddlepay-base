'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { useContract } from '@/hooks/useContract';
import ThemeToggle from '@/components/ThemeToggle';
import WalletConnect from '@/components/WalletConnect';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Gift, Sparkles } from 'lucide-react';

function LeaderboardContent() {
  const { address } = useWallet();
  const { getLeaderboard } = useContract();
  
  const [topSenders, setTopSenders] = useState<Array<{ address: string; count: number }>>([]);
  const [topSolvers, setTopSolvers] = useState<Array<{ address: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading leaderboard...');
        const data = await getLeaderboard();
        console.log('✅ Leaderboard data received:', data);
        setTopSenders(data.topSenders);
        setTopSolvers(data.topSolvers);
        
        if (data.topSenders.length === 0 && data.topSolvers.length === 0) {
          console.warn('⚠️ No leaderboard data found. Make sure gifts have been created and claimed.');
        }
      } catch (err: any) {
        console.error('❌ Error loading leaderboard:', err);
        console.error('Error details:', err.message, err.stack);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure contract is initialized
    const timer = setTimeout(() => {
      loadLeaderboard();
    }, 500);

    return () => clearTimeout(timer);
  }, [getLeaderboard]);

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="min-h-screen bg-baseDark dark:text-white text-gray-900 relative z-10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-2 bg-base-gradient bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="dark:text-gray-400 text-gray-600 text-sm">Top gifters and solvers</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle />
            <Link
              href="/"
              className="px-5 py-2.5 glass-strong rounded-xl dark:text-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 border border-baseBlue/20"
            >
              ← Send Gift
            </Link>
            <Link
              href="/my-gifts"
              className="px-5 py-2.5 glass-strong rounded-xl dark:text-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 border border-baseBlue/20"
            >
              My Gifts
            </Link>
            <WalletConnect />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baseBlue border-t-transparent mb-4"></div>
            <p className="dark:text-gray-400 text-gray-600 text-lg">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Senders */}
            <motion.div
              className="bg-baseLight/50 rounded-2xl p-8 border border-baseBlue/20 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-base-gradient flex items-center justify-center shadow-lg shadow-baseBlue/30">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-base-gradient bg-clip-text text-transparent">
                  Top Gifters 🎁
                </h2>
              </div>

              {topSenders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-gray-600">No gifts sent yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSenders.map((sender, index) => (
                    <motion.div
                      key={sender.address}
                      className={`p-4 glass rounded-xl border ${
                        index < 3 ? 'border-yellow-500/50' : 'border-baseBlue/20'
                      } flex items-center justify-between`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold w-8 text-center">
                          {getRankEmoji(index)}
                        </span>
                        <div>
                          <p className="font-mono text-sm dark:text-white text-gray-900 font-semibold">
                            {sender.address.slice(0, 6)}...{sender.address.slice(-4)}
                          </p>
                          {address?.toLowerCase() === sender.address && (
                            <span className="text-xs text-baseBlue">You</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-5 h-5 ${index < 3 ? 'text-yellow-500' : 'text-gray-400'}`} />
                        <span className="font-bold text-lg dark:text-white text-gray-900">
                          {sender.count}
                        </span>
                        <span className="text-sm dark:text-gray-400 text-gray-600">gifts</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top Solvers */}
            <motion.div
              className="bg-baseLight/50 rounded-2xl p-8 border border-baseBlue/20 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-base-gradient flex items-center justify-center shadow-lg shadow-baseBlue/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-base-gradient bg-clip-text text-transparent">
                  Top Solvers 🧩
                </h2>
              </div>

              {topSolvers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-gray-600">No gifts claimed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSolvers.map((solver, index) => (
                    <motion.div
                      key={solver.address}
                      className={`p-4 glass rounded-xl border ${
                        index < 3 ? 'border-green-500/50' : 'border-baseBlue/20'
                      } flex items-center justify-between`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold w-8 text-center">
                          {getRankEmoji(index)}
                        </span>
                        <div>
                          <p className="font-mono text-sm dark:text-white text-gray-900 font-semibold">
                            {solver.address.slice(0, 6)}...{solver.address.slice(-4)}
                          </p>
                          {address?.toLowerCase() === solver.address && (
                            <span className="text-xs text-baseBlue">You</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-5 h-5 ${index < 3 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className="font-bold text-lg dark:text-white text-gray-900">
                          {solver.count}
                        </span>
                        <span className="text-sm dark:text-gray-400 text-gray-600">solved</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  return (
    <WalletProvider>
      <LeaderboardContent />
    </WalletProvider>
  );
}

