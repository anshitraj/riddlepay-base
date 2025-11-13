'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import { useContract } from '@/hooks/useContract';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { Trophy, Gift, Sparkles, Star } from 'lucide-react';
import { getXPLeaderboard, getUserXP, getUserRank } from '@/utils/xpSystem';

function LeaderboardContent() {
  const { address } = useWallet();
  const { getLeaderboard } = useContract();
  
  const [topSenders, setTopSenders] = useState<Array<{ address: string; count: number }>>([]);
  const [topSolvers, setTopSolvers] = useState<Array<{ address: string; count: number }>>([]);
  const [xpLeaderboard, setXpLeaderboard] = useState<Array<{ address: string; xp: number }>>([]);
  const [userXP, setUserXP] = useState(0);
  const [userRank, setUserRank] = useState(0);
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
        
        // Load XP leaderboard
        const xpBoard = getXPLeaderboard();
        setXpLeaderboard(xpBoard);
        
        if (address) {
          setUserXP(getUserXP(address));
          setUserRank(getUserRank(address));
        }
        
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
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-gray-900 mb-1 sm:mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400 dark:text-gray-600 text-xs sm:text-sm">Top airdroppers and solvers</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="dark:text-gray-400 text-gray-600 text-lg">Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* User XP Card */}
            {address && (
              <motion.div
                className="glass rounded-2xl p-6 border border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 dark:text-gray-600 mb-1">Your Stats</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold text-white dark:text-gray-900">{userXP}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">Total XP</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white dark:text-gray-900">#{userRank}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">Rank</p>
                      </div>
                    </div>
                  </div>
                  <Star className="w-12 h-12 text-yellow-500" />
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Top Senders */}
            <motion.div
              className="glass rounded-2xl p-8 border border-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white dark:text-gray-900">
                  Top Airdroppers 🎁
                </h2>
              </div>

              {topSenders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-gray-600">No airdrops sent yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSenders.map((sender, index) => (
                    <motion.div
                      key={sender.address}
                      className={`p-4 glass rounded-xl border ${
                        index < 3 ? 'border-yellow-500/50' : 'border-blue-500/20'
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
                            <span className="text-xs text-blue-500">You</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-5 h-5 ${index < 3 ? 'text-yellow-500' : 'text-gray-400'}`} />
                        <span className="font-bold text-lg dark:text-white text-gray-900">
                          {sender.count}
                        </span>
                        <span className="text-sm dark:text-gray-400 text-gray-600">airdrops</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top Solvers */}
            <motion.div
              className="glass rounded-2xl p-8 border border-border"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white dark:text-gray-900">
                  Top Solvers 🧩
                </h2>
              </div>

              {topSolvers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-gray-600">No airdrops claimed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSolvers.map((solver, index) => (
                    <motion.div
                      key={solver.address}
                      className={`p-4 glass rounded-xl border ${
                        index < 3 ? 'border-green-500/50' : 'border-blue-500/20'
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
                            <span className="text-xs text-blue-500">You</span>
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
          
          {/* XP Leaderboard */}
          <motion.div
            className="glass rounded-2xl p-8 border border-border lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white dark:text-gray-900">
                XP Leaderboard ⭐
              </h2>
            </div>

            {xpLeaderboard.length === 0 ? (
              <div className="text-center py-12">
                <p className="dark:text-gray-400 text-gray-600">No XP earned yet. Start sending airdrops to earn XP!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {xpLeaderboard.slice(0, 9).map((entry, index) => (
                  <motion.div
                    key={entry.address}
                    className={`p-4 glass rounded-xl border ${
                      index < 3 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-blue-500/20'
                    } flex items-center justify-between`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-6 text-center">
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`}
                      </span>
                      <div>
                        <p className="font-mono text-xs dark:text-white text-gray-900 font-semibold">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </p>
                        {address?.toLowerCase() === entry.address.toLowerCase() && (
                          <span className="text-xs text-blue-500">You</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-sm dark:text-white text-gray-900">{entry.xp}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
        )}
      </div>
    </Layout>
  );
}

export default function Leaderboard() {
  return (
    <WalletProvider>
      <SearchProviderWrapper>
        <LeaderboardContent />
      </SearchProviderWrapper>
    </WalletProvider>
  );
}

