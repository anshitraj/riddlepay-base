'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Send, Package, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatAmount } from '@/utils/formatAmount';

export default function Dashboard() {
  const { address, provider } = useWallet();
  const { getGiftCount, getTotalValueLocked, getGiftsForUser, getGift } = useContract();
  const [stats, setStats] = useState({
    totalGifts: 0,
    totalValueETH: '0',
    totalValueUSDC: '0',
    userETHBalance: '0',
    userUSDCBalance: '0',
    userGiftsSent: 0,
    userGiftsReceived: 0,
  });
  const statsRef = useRef(stats);
  const [loading, setLoading] = useState(true);
  const [recentGifts, setRecentGifts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Keep statsRef in sync with stats
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [totalGifts, valueLocked, userGiftIds] = await Promise.all([
        getGiftCount().catch(err => {
          console.error('Error getting gift count:', err);
          // Return current totalGifts instead of 0 to prevent reset
          // But if it's the first load and we have no previous value, try to return a fallback
          const fallback = statsRef.current.totalGifts || 0;
          console.warn(`⚠️ Using fallback gift count: ${fallback}`);
          return fallback;
        }),
        getTotalValueLocked().catch(err => {
          console.error('Error getting total value locked:', err);
          return { totalETH: '0', totalUSDC: '0' };
        }),
        address ? getGiftsForUser(address).catch(err => {
          console.error('Error getting user gifts:', err);
          // Return previous user gift IDs if available to prevent reset
          const previousUserGifts = statsRef.current.userGiftsSent + statsRef.current.userGiftsReceived;
          if (previousUserGifts > 0) {
            console.warn(`⚠️ Using previous user gift count: ${previousUserGifts}`);
            // Return a dummy array to maintain structure, but we'll use previous counts
            return [];
          }
          return [];
        }) : Promise.resolve([]),
      ]);

      // Get user's gifts - count ALL gifts for accurate totals
      let userSent = statsRef.current.userGiftsSent || 0;
      let userReceived = statsRef.current.userGiftsReceived || 0;
      
      // Count all user gifts for accurate totals
      if (userGiftIds && userGiftIds.length > 0) {
        // Limit to first 50 gifts for performance (for counting)
        const giftsToCount = userGiftIds.slice(0, 50);
        const giftPromises = giftsToCount.map(async (id) => {
          try {
            const gift = await getGift(id);
            return { gift, id };
          } catch {
            return null;
          }
        });
        const userGifts = await Promise.all(giftPromises);
        
        // Reset counters before counting
        userSent = 0;
        userReceived = 0;
        
        userGifts.forEach((item) => {
          if (!item) return;
          const { gift } = item;
          if (gift.sender.toLowerCase() === address?.toLowerCase()) {
            userSent++;
          }
          if (gift.receiver.toLowerCase() === address?.toLowerCase()) {
            userReceived++;
          }
        });

        // Set recent gifts (first 5) for display
        setRecentGifts(userGifts.filter(g => g !== null).slice(0, 5) as Array<{ gift: any; id: number }>);
      } else {
        setRecentGifts([]);
        // If we got an empty array but had previous counts, keep them
        // Only reset if this is a fresh load (no previous counts)
        if (statsRef.current.userGiftsSent === 0 && statsRef.current.userGiftsReceived === 0) {
          userSent = 0;
          userReceived = 0;
        }
      }
      
      // Parse values safely
      let ethValue = parseFloat(valueLocked.totalETH) || 0;
      let usdcValue = parseFloat(valueLocked.totalUSDC) || 0;
      
      // Get user's wallet balances
      let userETHBalance = '0';
      let userUSDCBalance = '0';
      
      if (address && provider) {
        try {
          // Get ETH balance
          const ethBalance = await provider.getBalance(address);
          userETHBalance = parseFloat(ethers.formatEther(ethBalance)).toFixed(4);
          
          // Get USDC balance
          const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
          if (USDC_ADDRESS) {
            try {
              const usdcContract = new ethers.Contract(
                USDC_ADDRESS,
                ['function balanceOf(address owner) external view returns (uint256)'],
                provider
              );
              const usdcBalance = await usdcContract.balanceOf(address);
              userUSDCBalance = parseFloat(ethers.formatUnits(usdcBalance, 6)).toFixed(2);
            } catch (usdcErr) {
              console.warn('Error fetching USDC balance:', usdcErr);
              userUSDCBalance = statsRef.current.userUSDCBalance || '0';
            }
          }
        } catch (balanceErr) {
          console.warn('Error fetching wallet balances:', balanceErr);
          userETHBalance = statsRef.current.userETHBalance || '0';
          userUSDCBalance = statsRef.current.userUSDCBalance || '0';
        }
      }
      
      // If contract function returns 0 or very small values, manually calculate TVL
      const totalGiftsNum = Number(totalGifts) || 0;
      if ((ethValue === 0 && usdcValue === 0 && totalGiftsNum > 0) || 
          (ethValue < 0.0001 && usdcValue < 0.01 && totalGiftsNum > 0)) {
        console.log('📊 Contract TVL seems incorrect, calculating manually from gifts...');
        
        // Manually calculate TVL by iterating through all unclaimed gifts
        let manualETH = BigInt(0);
        let manualUSDC = BigInt(0);
        const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS?.toLowerCase() || '';
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
        
        // Limit to first 500 gifts to avoid timeout
        const maxGifts = Math.min(totalGiftsNum, 500);
        for (let i = 0; i < maxGifts; i++) {
          try {
            const gift = await getGift(i);
            // Only count unclaimed gifts (claimed gifts are no longer locked)
            if (!gift.claimed) {
              const tokenAddress = gift.tokenAddress?.toLowerCase() || '';
              const amount = BigInt(gift.amount || '0');
              
              if (tokenAddress === ZERO_ADDRESS || tokenAddress === '') {
                // ETH gift
                manualETH += amount;
              } else if (tokenAddress === USDC_ADDRESS) {
                // USDC gift
                manualUSDC += amount;
              }
            }
            // Small delay every 10 gifts to avoid rate limiting
            if (i > 0 && i % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (err) {
            // Gift might not exist, skip it
            continue;
          }
        }
        
        // Convert from wei/units to readable format
        ethValue = parseFloat(ethers.formatEther(manualETH));
        usdcValue = parseFloat(ethers.formatUnits(manualUSDC, 6)); // USDC has 6 decimals
        
        console.log('✅ Manually calculated TVL:', { ETH: ethValue, USDC: usdcValue });
      }
      
      setStats({
        totalGifts: totalGiftsNum,
        totalValueETH: ethValue.toFixed(4),
        totalValueUSDC: usdcValue.toFixed(2),
        userETHBalance: userETHBalance,
        userUSDCBalance: userUSDCBalance,
        userGiftsSent: userSent,
        userGiftsReceived: userReceived,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      // Don't reset to 0 on error - keep previous values
      // Only update if we have valid data
      console.warn('⚠️ Stats loading error, keeping previous values');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [address, provider, getGiftCount, getTotalValueLocked, getGiftsForUser, getGift]);

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(() => loadStats(false), 30000);
    
    return () => clearInterval(interval);
  }, [loadStats]);
  
  const handleRefresh = () => {
    loadStats(true);
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 xl:space-y-6">
      {/* Total Balance Card */}
      <motion.div
        className="relative glass rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-6 border border-border dark:border-border border-gray-200 dark:border-border overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <p className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 font-semibold">TOTAL VALUE LOCKED</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-1.5 sm:p-2 rounded-lg glass border border-border hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center"
              title="Refresh stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent leading-tight">
            ${(parseFloat(stats.totalValueETH) * 3000 + parseFloat(stats.totalValueUSDC)).toFixed(2)}
          </h2>
          {/* Hide stats on mobile, show on larger screens */}
          <div className="hidden md:flex gap-6 flex-wrap">
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1">Today</p>
              <p className="text-sm font-bold text-green-400 dark:text-green-400 text-green-600 dark:text-green-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1">7 Days</p>
              <p className="text-sm font-bold text-green-400 dark:text-green-400 text-green-600 dark:text-green-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1">30 Days</p>
              <p className="text-sm font-bold text-green-400 dark:text-green-400 text-green-600 dark:text-green-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
          </div>
        </div>
        
        {/* Base-Style Cards Grid */}
        {/* Row 1: Tokens */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-4">
          <motion.div 
            className="relative bg-[#0E152B]/30 dark:bg-[#0E152B]/30 bg-white/90 dark:bg-[#0E152B]/30 backdrop-blur-xl rounded-[20px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 border border-[#0066FF]/10 dark:border-[#0066FF]/10 border-gray-200 dark:border-[#0066FF]/10 hover:border-[#0066FF]/30 dark:hover:border-[#0066FF]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#0066FF]/20 group cursor-pointer touch-manipulation min-h-[120px] sm:min-h-[140px] flex flex-col justify-between overflow-hidden"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Neon glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all flex-shrink-0 ring-2 ring-orange-500/10 group-hover:ring-orange-500/30">
                <span className="text-orange-400 font-bold text-lg sm:text-xl">B</span>
              </div>
              <motion.div
                whileHover={{ scale: 1.2, rotate: 45 }}
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <ArrowUpRight className="w-full h-full" />
              </motion.div>
            </div>
            <div className="relative flex-1 flex flex-col justify-end">
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1 font-medium">ETH</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white text-gray-900 mb-1 break-all leading-tight">
                {address ? stats.userETHBalance : '0.0000'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500 mb-1">Your Base ETH balance</p>
              <p className="text-xs sm:text-sm text-green-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="relative bg-[#0E152B]/30 dark:bg-[#0E152B]/30 bg-white/90 dark:bg-[#0E152B]/30 backdrop-blur-xl rounded-[20px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 border border-[#0066FF]/10 dark:border-[#0066FF]/10 border-gray-200 dark:border-[#0066FF]/10 hover:border-[#0066FF]/30 dark:hover:border-[#0066FF]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#0066FF]/20 group cursor-pointer touch-manipulation min-h-[120px] sm:min-h-[140px] flex flex-col justify-between overflow-hidden"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all flex-shrink-0 ring-2 ring-blue-500/10 group-hover:ring-blue-500/30">
                <span className="text-blue-400 font-bold text-lg sm:text-xl">U</span>
              </div>
              <motion.div
                whileHover={{ scale: 1.2, rotate: 45 }}
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <ArrowUpRight className="w-full h-full" />
              </motion.div>
            </div>
            <div className="relative flex-1 flex flex-col justify-end">
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1 font-medium">USDC</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white text-gray-900 mb-1 break-all leading-tight">
                {address ? stats.userUSDCBalance : '0.00'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500 mb-1">Your stablecoins balance</p>
              <p className="text-xs sm:text-sm text-green-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Airdrops */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-4 mt-4 sm:mt-5 md:mt-4">
          <motion.div 
            className="relative bg-[#0E152B]/30 dark:bg-[#0E152B]/30 bg-white/90 dark:bg-[#0E152B]/30 backdrop-blur-xl rounded-[20px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 border border-[#0066FF]/10 dark:border-[#0066FF]/10 border-gray-200 dark:border-[#0066FF]/10 hover:border-[#0066FF]/30 dark:hover:border-[#0066FF]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#0066FF]/20 group cursor-pointer touch-manipulation min-h-[120px] sm:min-h-[140px] flex flex-col justify-between overflow-hidden"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all flex-shrink-0 ring-2 ring-blue-500/10 group-hover:ring-blue-500/30">
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              </div>
              <motion.div
                whileHover={{ scale: 1.2, rotate: 45 }}
                className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <ArrowUpRight className="w-full h-full" />
              </motion.div>
            </div>
            <div className="relative flex-1 flex flex-col justify-end">
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1 font-medium">Total Airdrops</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white text-gray-900 mb-1 leading-tight">{stats.totalGifts}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500 mb-1">Active drops</p>
              <p className="text-xs sm:text-sm text-green-400 font-semibold">Active</p>
            </div>
          </motion.div>

          {address && (
          <Link href="/my-gifts" prefetch={true} className="block">
            <motion.div 
              className="relative bg-[#0E152B]/30 dark:bg-[#0E152B]/30 bg-white/90 dark:bg-[#0E152B]/30 backdrop-blur-xl rounded-[20px] sm:rounded-[22px] p-3 sm:p-4 md:p-5 border border-[#0066FF]/10 dark:border-[#0066FF]/10 border-gray-200 dark:border-[#0066FF]/10 hover:border-[#0066FF]/30 dark:hover:border-[#0066FF]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#0066FF]/20 group cursor-pointer touch-manipulation min-h-[120px] sm:min-h-[140px] flex flex-col justify-between overflow-hidden"
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center group-hover:from-yellow-500/30 group-hover:to-yellow-600/30 transition-all flex-shrink-0 ring-2 ring-yellow-500/10 group-hover:ring-yellow-500/30">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 45 }}
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowUpRight className="w-full h-full" />
                  </motion.div>
                </div>
                <div className="relative flex-1 flex flex-col justify-end">
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 mb-1 font-medium">Your Airdrops</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white text-gray-900 mb-1 leading-tight">
                    {stats.userGiftsSent + stats.userGiftsReceived}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-500 mb-1">Sent + Received</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 leading-tight">
                    {stats.userGiftsSent} sent • {stats.userGiftsReceived} received
                  </p>
                </div>
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
        <Link href="/#create-airdrop-form" prefetch={true}>
          <motion.div
            className="relative glass rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 border border-border hover:border-blue-500/50 transition-all cursor-pointer group overflow-hidden touch-manipulation min-h-[72px] sm:min-h-[80px] md:min-h-[100px]"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:scale-110 flex-shrink-0">
                <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-gray-900 group-hover:text-blue-400 transition-colors mb-0.5">
                  Send Airdrop
                </h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 leading-tight">Create a new airdrop</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0" />
            </div>
          </motion.div>
        </Link>

        <Link href="/bulk-giveaway" prefetch={true}>
          <motion.div
            className="relative glass rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 border border-border hover:border-blue-500/50 transition-all cursor-pointer group overflow-hidden touch-manipulation min-h-[72px] sm:min-h-[80px] md:min-h-[100px]"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:scale-110 flex-shrink-0">
                <Package className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-gray-900 group-hover:text-blue-400 transition-colors mb-0.5">
                  Bulk Airdrop
                </h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 leading-tight">Send to multiple winners</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0" />
            </div>
          </motion.div>
        </Link>

        <Link href="/my-gifts" prefetch={true}>
          <motion.div
            className="relative glass rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-5 border border-border hover:border-green-500/50 transition-all cursor-pointer group overflow-hidden touch-manipulation min-h-[72px] sm:min-h-[80px] md:min-h-[100px]"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all group-hover:scale-110 flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white dark:text-white text-gray-900 dark:text-gray-900 group-hover:text-green-400 transition-colors mb-0.5">
                  My Airdrops
                </h3>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 leading-tight">View all your airdrops</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Recent Gifts */}
      {address && recentGifts.length > 0 && (
        <motion.div
          className="glass rounded-2xl p-6 border border-border dark:border-border border-gray-200 dark:border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white dark:text-white text-gray-900 dark:text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-400/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              Recent Airdrops
            </h3>
            <Link href="/my-gifts" prefetch={true} className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group">
              View all
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentGifts.map((item, idx) => {
              const { gift, id } = item;
              return (
                <Link key={idx} href={`/claim?giftId=${id}`} prefetch={true}>
                  <motion.div 
                    className="glass rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-border dark:border-border border-gray-200 dark:border-border hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group touch-manipulation"
                    whileHover={{ scale: 1.01, x: 4 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all group-hover:scale-110 flex-shrink-0 ${
                          gift.riddle && gift.riddle.trim() 
                            ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 group-hover:from-blue-500/30 group-hover:to-blue-600/30' 
                            : 'bg-gradient-to-br from-green-500/20 to-green-600/20 group-hover:from-green-500/30 group-hover:to-green-600/30'
                        }`}>
                          {gift.riddle && gift.riddle.trim() ? (
                            <span className="text-lg sm:text-xl md:text-2xl">🎯</span>
                          ) : (
                            <span className="text-lg sm:text-xl md:text-2xl">🎁</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-base font-bold text-white dark:text-white text-gray-900 dark:text-gray-900 group-hover:text-blue-400 transition-colors mb-0.5 truncate">
                            {gift.riddle && gift.riddle.trim() ? 'Riddle Airdrop' : 'Direct Airdrop'}
                          </p>
                          <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 truncate">
                            {formatAmount(gift.amount, gift.tokenAddress)}
                            {gift.claimed && ' • Claimed'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-[9px] sm:text-xs text-gray-500 hidden sm:inline">
                          {new Date(Number(gift.createdAt) * 1000).toLocaleDateString()}
                        </span>
                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Powered by Base Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4 sm:mt-6 md:mt-8 pt-3 sm:pt-4 md:pt-6 border-t border-border"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Powered by</span>
            {/* Base Logo - Blue square with rounded corners */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#0052FF] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
                <rect width="20" height="20" rx="4" fill="#0052FF"/>
              </svg>
            </div>
            <span className="text-white dark:text-white text-gray-900 dark:text-gray-900 font-semibold text-sm sm:text-base">Base</span>
          </div>
          <span className="hidden sm:inline text-gray-600 dark:text-gray-500 text-gray-600 dark:text-gray-500">—</span>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 text-gray-600 dark:text-gray-400 text-center">
            Secure, low-cost Ethereum L2 blockchain
          </p>
        </div>
      </motion.div>
    </div>
  );
}
