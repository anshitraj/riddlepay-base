'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/contexts/WalletContext';
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

  // Calculate portfolio value in USD
  // Using approximate ETH price (can be updated or fetched from API)
  const ETH_PRICE_USD = 3200; // Approximate ETH price in USD
  const portfolioValueUSD = address 
    ? (parseFloat(stats.userETHBalance) * ETH_PRICE_USD + parseFloat(stats.userUSDCBalance)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      {/* Your Portfolio Card */}
      <div className="relative bg-white dark:glass rounded-xl p-4 border border-gray-200 dark:border-border overflow-hidden">
        
        <div className="relative flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-[#6b7280] dark:text-gray-400 font-semibold">YOUR PORTFOLIO</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-lg bg-white dark:glass border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Refresh portfolio"
            >
              <RefreshCw className={`w-4 h-4 text-[#6b7280] dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h2 className="text-4xl font-bold text-[#0f172a] dark:text-white leading-tight">
            ${portfolioValueUSD}
          </h2>
          {address && (
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-[#6b7280] dark:text-gray-400 mb-1">ETH Value</p>
                <p className="text-sm font-semibold text-[#1e293b] dark:text-white">
                  ${(parseFloat(stats.userETHBalance) * ETH_PRICE_USD).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6b7280] dark:text-gray-400 mb-1">USDC Value</p>
                <p className="text-sm font-semibold text-[#1e293b] dark:text-white">
                  ${parseFloat(stats.userUSDCBalance).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          {!address && (
            <p className="text-sm text-[#6b7280] dark:text-gray-400">Connect your wallet to view your portfolio</p>
          )}
        </div>
        
        {/* Base-Style Cards Grid */}
        {/* Row 1: TVL and USDC */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative bg-white dark:bg-[#0E152B]/30 rounded-xl p-4 border border-gray-200 dark:border-[#0066FF]/10 hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-1 font-medium">TVL</p>
              <p className="text-xl font-bold text-[#1e293b] dark:text-white mb-1 break-all leading-tight">
                ${(parseFloat(stats.totalValueETH) * ETH_PRICE_USD + parseFloat(stats.totalValueUSDC)).toFixed(2)}
              </p>
              <p className="text-xs text-[#6b7280] dark:text-gray-500 mb-1">Total Value Locked</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
          </div>
          
          <div className="relative bg-white dark:bg-[#0E152B]/30 rounded-xl p-4 border border-gray-200 dark:border-[#0066FF]/10 hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">U</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-1 font-medium">USDC</p>
              <p className="text-xl font-bold text-[#1e293b] dark:text-white mb-1 break-all leading-tight">
                {address ? stats.userUSDCBalance : '0.00'}
              </p>
              <p className="text-xs text-[#6b7280] dark:text-gray-500 mb-1">Your stablecoins balance</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +0.00%
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Airdrops */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="relative bg-white dark:bg-[#0E152B]/30 rounded-xl p-4 border border-gray-200 dark:border-[#0066FF]/10 hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-1 font-medium">Total Airdrops</p>
              <p className="text-xl font-bold text-[#1e293b] dark:text-white mb-1 leading-tight">{stats.totalGifts}</p>
              <p className="text-xs text-[#6b7280] dark:text-gray-500 mb-1">Active drops</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Active</p>
            </div>
          </div>

          {address && (
          <Link href="/my-gifts" prefetch={true} className="block">
            <div className="relative bg-white dark:bg-[#0E152B]/30 rounded-xl p-4 border border-gray-200 dark:border-[#0066FF]/10 hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[120px] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FFECC7] dark:bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-1 font-medium">Your Airdrops</p>
                  <p className="text-xl font-bold text-[#1e293b] dark:text-white mb-1 leading-tight">
                    {stats.userGiftsSent + stats.userGiftsReceived}
                  </p>
                  <p className="text-xs text-[#6b7280] dark:text-gray-500 mb-1">Sent + Received</p>
                  <p className="text-sm text-[#6b7280] dark:text-gray-400 leading-tight">
                    {stats.userGiftsSent} sent • {stats.userGiftsReceived} received
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/#create-airdrop-form" prefetch={true}>
          <div className="relative bg-white dark:glass rounded-xl p-4 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[80px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#0f172a] dark:text-white mb-0.5">
                  Send Airdrop
                </h3>
                <p className="text-xs text-[#6b7280] dark:text-gray-400 leading-tight">Create a new airdrop</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/bulk-giveaway" prefetch={true}>
          <div className="relative bg-white dark:glass rounded-xl p-4 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[80px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#0f172a] dark:text-white mb-0.5">
                  Bulk Airdrop
                </h3>
                <p className="text-xs text-[#6b7280] dark:text-gray-400 leading-tight">Send to multiple winners</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/my-gifts" prefetch={true}>
          <div className="relative bg-white dark:glass rounded-xl p-4 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer min-h-[80px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E8FAF4] dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#0f172a] dark:text-white mb-0.5">
                  My Airdrops
                </h3>
                <p className="text-xs text-[#6b7280] dark:text-gray-400 leading-tight">View all your airdrops</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Gifts */}
      {address && recentGifts.length > 0 && (
        <div className="bg-white dark:glass rounded-xl p-4 border border-gray-200 dark:border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#0f172a] dark:text-white flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[#E4ECFF] dark:bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Recent Airdrops
            </h3>
            <Link href="/my-gifts" prefetch={true} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1">
              View all
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentGifts.map((item, idx) => {
              const { gift, id } = item;
              return (
                <Link key={idx} href={`/claim?giftId=${id}`} prefetch={true}>
                  <div className="bg-white dark:glass rounded-lg p-3 border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-[#0E152B]/40 transition-colors duration-75 cursor-pointer">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          gift.riddle && gift.riddle.trim() 
                            ? 'bg-[#E4ECFF] dark:bg-blue-500/20' 
                            : 'bg-[#E8FAF4] dark:bg-green-500/20'
                        }`}>
                          {gift.riddle && gift.riddle.trim() ? (
                            <span className="text-xl">🎯</span>
                          ) : (
                            <span className="text-xl">🎁</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#0f172a] dark:text-white mb-0.5 truncate">
                            {gift.riddle && gift.riddle.trim() ? 'Riddle Airdrop' : 'Direct Airdrop'}
                          </p>
                          <p className="text-xs text-[#6b7280] dark:text-gray-400 truncate">
                            {formatAmount(gift.amount, gift.tokenAddress)}
                            {gift.claimed && ' • Claimed'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#6b7280] dark:text-gray-500 hidden sm:inline">
                          {new Date(Number(gift.createdAt) * 1000).toLocaleDateString()}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-[#6b7280] dark:text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Powered by Base Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-border">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#6b7280] dark:text-gray-400 text-xs">Powered by</span>
            {/* Base Logo - Blue square with rounded corners */}
            <div className="w-6 h-6 bg-[#0052FF] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="20" height="20" rx="4" fill="#0052FF"/>
              </svg>
            </div>
            <span className="text-[#0f172a] dark:text-white font-semibold text-sm">Base</span>
          </div>
          <span className="hidden sm:inline text-[#6b7280] dark:text-gray-500">—</span>
          <p className="text-xs text-[#6b7280] dark:text-gray-400 text-center">
            Secure, low-cost Ethereum L2 blockchain
          </p>
        </div>
      </div>
    </div>
  );
}
