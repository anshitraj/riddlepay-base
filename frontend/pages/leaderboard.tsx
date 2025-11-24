'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import { useContract } from '@/hooks/useContract';
import Layout from '@/components/Layout';
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

    // Load immediately without delay for faster rendering
    loadLeaderboard();
  }, [getLeaderboard, address]);

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="mt-2 mb-1">
          <h1 className="text-[22px] font-semibold text-white dark:text-white text-[#111827] dark:text-white">
            Leaderboard
          </h1>
          <p className="text-[13px] text-gray-400 dark:text-gray-400 text-[#6b7280] dark:text-gray-400 mt-0">Top airdroppers and solvers</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4f6ef7] dark:border-blue-500 border-t-transparent mb-4"></div>
            <p className="dark:text-gray-400 text-[#6b7280] dark:text-gray-400 text-lg">Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* User XP Card */}
            {address && (
              <div className="bg-white dark:bg-[#0E152B]/30 bg-[#fafbff] dark:bg-[#0E152B]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none rounded-xl p-6 border border-[#eaecef] dark:border-[#0066FF]/10 border-[#e3e7ef] dark:border-[#0066FF]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 dark:text-gray-400 text-[#6b7280] dark:text-gray-400 mb-1">Your Stats</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold text-white dark:text-white text-[#111827] dark:text-white">{userXP}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-400 text-[#6b7280] dark:text-gray-400">Total XP</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white dark:text-white text-[#111827] dark:text-white">#{userRank}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-400 text-[#6b7280] dark:text-gray-400">Rank</p>
                      </div>
                    </div>
                  </div>
                  <Star className="w-12 h-12 text-yellow-500 dark:text-yellow-500 text-[#f1c40f] dark:text-yellow-500" />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Top Senders */}
            <div className="bg-white dark:bg-[#0E152B]/30 bg-[#fafbff] dark:bg-[#0E152B]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none rounded-xl p-6 border border-[#eaecef] dark:border-[#0066FF]/10 border-[#e3e7ef] dark:border-[#0066FF]/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4f6ef7] to-[#4f6ef7] dark:from-blue-500 dark:to-blue-600 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white dark:text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white dark:text-white text-[#111827] dark:text-white">
                  Top Airdroppers 🎁
                </h2>
              </div>

              {topSenders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-[#6b7280] dark:text-gray-400">No airdrops sent yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSenders.map((sender, index) => (
                    <div
                      key={sender.address}
                      className="bg-white dark:bg-[#0E152B]/30 rounded-lg py-3 px-4 border border-[#eeeeee] dark:border-[#0066FF]/10 hover:shadow-md dark:hover:shadow-none hover:bg-[#f6f8fc] dark:hover:bg-[#0E152B]/40 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold w-8 text-center">
                          {getRankEmoji(index)}
                        </span>
                        <div>
                          <p className="font-mono text-sm dark:text-white text-[#1e293b] dark:text-white font-medium">
                            {sender.address.slice(0, 6)}...{sender.address.slice(-4)}
                          </p>
                          {address?.toLowerCase() === sender.address && (
                            <span className="text-xs text-[#8492a6] dark:text-blue-500 ml-2">You</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-5 h-5 ${index < 3 ? 'text-[#f1c40f] dark:text-yellow-500' : 'text-gray-400 dark:text-gray-400'}`} />
                        <span className="font-semibold text-lg dark:text-white text-[#111827] dark:text-white">
                          {sender.count}
                        </span>
                        <span className="text-sm dark:text-gray-400 text-[#6b7280] dark:text-gray-400">airdrops</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Solvers */}
            <div className="bg-white dark:bg-[#0E152B]/30 bg-[#fafbff] dark:bg-[#0E152B]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none rounded-xl p-6 border border-[#eaecef] dark:border-[#0066FF]/10 border-[#e3e7ef] dark:border-[#0066FF]/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#11a37f] to-[#11a37f] dark:from-green-500 dark:to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white dark:text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white dark:text-white text-[#111827] dark:text-white">
                  Top Solvers 🧩
                </h2>
              </div>

              {topSolvers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-[#6b7280] dark:text-gray-400">No airdrops claimed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSolvers.map((solver, index) => (
                    <div
                      key={solver.address}
                      className="bg-white dark:bg-[#0E152B]/30 rounded-lg py-3 px-4 border border-[#eeeeee] dark:border-[#0066FF]/10 hover:shadow-md dark:hover:shadow-none hover:bg-[#f6f8fc] dark:hover:bg-[#0E152B]/40 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold w-8 text-center">
                          {getRankEmoji(index)}
                        </span>
                        <div>
                          <p className="font-mono text-sm dark:text-white text-[#1e293b] dark:text-white font-medium">
                            {solver.address.slice(0, 6)}...{solver.address.slice(-4)}
                          </p>
                          {address?.toLowerCase() === solver.address && (
                            <span className="text-xs text-[#8492a6] dark:text-blue-500 ml-2">You</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-5 h-5 ${index < 3 ? 'text-[#11a37f] dark:text-green-500' : 'text-gray-400 dark:text-gray-400'}`} />
                        <span className="font-semibold text-lg dark:text-white text-[#111827] dark:text-white">
                          {solver.count}
                        </span>
                        <span className="text-sm dark:text-gray-400 text-[#6b7280] dark:text-gray-400">solved</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* XP Leaderboard */}
          <div className="bg-white dark:bg-[#0E152B]/30 bg-[#fafbff] dark:bg-[#0E152B]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none rounded-xl p-6 border border-[#eaecef] dark:border-[#0066FF]/10 border-[#e3e7ef] dark:border-[#0066FF]/10 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f1c40f] to-[#f1c40f] dark:from-yellow-500 dark:to-orange-600 flex items-center justify-center">
                <Star className="w-6 h-6 text-white dark:text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white dark:text-white text-[#111827] dark:text-white">
                XP Leaderboard ⭐
              </h2>
            </div>

            {xpLeaderboard.length === 0 ? (
              <div className="text-center py-12">
                <p className="dark:text-gray-400 text-[#6b7280] dark:text-gray-400">No XP earned yet. Start sending airdrops to earn XP!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {xpLeaderboard.slice(0, 9).map((entry, index) => (
                  <div
                    key={entry.address}
                    className="bg-white dark:bg-[#0E152B]/30 rounded-lg py-3 px-4 border border-[#eeeeee] dark:border-[#0066FF]/10 hover:shadow-md dark:hover:shadow-none hover:bg-[#f6f8fc] dark:hover:bg-[#0E152B]/40 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-6 text-center">
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`}
                      </span>
                      <div>
                        <p className="font-mono text-xs dark:text-white text-[#1e293b] dark:text-white font-medium">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </p>
                        {address?.toLowerCase() === entry.address.toLowerCase() && (
                          <span className="text-xs text-[#8492a6] dark:text-blue-500 ml-2">You</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#f1c40f] dark:text-yellow-500" />
                      <span className="font-semibold text-sm dark:text-white text-[#111827] dark:text-white">{entry.xp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
        )}
      </div>
    </Layout>
  );
}

export default function Leaderboard() {
  return (
    <SearchProviderWrapper>
      <LeaderboardContent />
    </SearchProviderWrapper>
  );
}

