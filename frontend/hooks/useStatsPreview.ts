'use client';

import { useState, useEffect } from 'react';
import { useContract } from './useContract';
import { ethers } from 'ethers';

interface StatsPreview {
  tvlChange: number;
  claimsToday: number;
  riddleSolves: number;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export function useStatsPreview() {
  const { readContract, getTotalValueLocked, getGiftCount, getGift } = useContract();
  const [stats, setStats] = useState<StatsPreview>({
    tvlChange: 0,
    claimsToday: 0,
    riddleSolves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readContract || !CONTRACT_ADDRESS) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get current TVL
        const currentTVL = await getTotalValueLocked();
        const currentTVLValue = parseFloat(currentTVL.totalETH) * 3000 + parseFloat(currentTVL.totalUSDC);

        // Get previous TVL from localStorage (stored yesterday)
        const storedTVL = localStorage.getItem('riddlepay_previous_tvl');
        const previousTVL = storedTVL ? parseFloat(storedTVL) : currentTVLValue;
        
        // Calculate TVL change percentage
        let tvlChange = 0;
        if (previousTVL > 0) {
          tvlChange = ((currentTVLValue - previousTVL) / previousTVL) * 100;
        }

        // Store current TVL for tomorrow's comparison (only update once per day)
        const lastUpdate = localStorage.getItem('riddlepay_tvl_update_date');
        const today = new Date().toDateString();
        if (lastUpdate !== today) {
          localStorage.setItem('riddlepay_previous_tvl', currentTVLValue.toString());
          localStorage.setItem('riddlepay_tvl_update_date', today);
        }

        // Get today's timestamp (start of day UTC)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTodayTimestamp = Math.floor(startOfToday.getTime() / 1000);

        // Get GiftClaimed events from today
        let claimsToday = 0;
        let riddleSolves = 0;

        try {
          // Get all GiftClaimed events
          const claimedFilter = readContract.filters.GiftClaimed();
          const events = await readContract.queryFilter(claimedFilter);

          // Filter events from today
          const todayEvents = events.filter((event: any) => {
            if (!event.blockNumber) return false;
            return true; // We'll check the block timestamp
          });

          // Get block timestamps for today's events
          const provider = readContract.provider;
          const todayEventPromises = events.slice(-100).map(async (event: any) => {
            try {
              const block = await provider.getBlock(event.blockNumber);
              if (block && block.timestamp >= startOfTodayTimestamp) {
                // Check if this gift had a riddle
                const giftId = event.args?.giftId?.toString();
                if (giftId) {
                  try {
                    const gift = await getGift(parseInt(giftId));
                    if (gift.riddle && gift.riddle.trim().length > 0) {
                      riddleSolves++;
                    }
                  } catch {
                    // Ignore errors fetching individual gifts
                  }
                }
                return true;
              }
              return false;
            } catch {
              return false;
            }
          });

          const todayResults = await Promise.all(todayEventPromises);
          claimsToday = todayResults.filter(Boolean).length;
        } catch (error) {
          console.error('Error fetching claims stats:', error);
          // Fallback: try to get from recent gifts
          try {
            const totalGifts = await getGiftCount();
            const recentGifts = [];
            const maxCheck = Math.min(totalGifts, 50);
            
            for (let i = 0; i < maxCheck; i++) {
              try {
                const gift = await getGift(i);
                if (gift.claimed) {
                  const createdAt = parseInt(gift.createdAt);
                  const claimTime = createdAt; // Approximate - we don't have exact claim time
                  const claimDate = new Date(claimTime * 1000);
                  const claimDateStart = new Date(claimDate.getFullYear(), claimDate.getMonth(), claimDate.getDate());
                  
                  if (claimDateStart.getTime() >= startOfToday.getTime()) {
                    claimsToday++;
                    if (gift.riddle && gift.riddle.trim().length > 0) {
                      riddleSolves++;
                    }
                  }
                }
              } catch {
                // Skip errors
              }
            }
          } catch (fallbackError) {
            console.error('Fallback stats fetch failed:', fallbackError);
          }
        }

        setStats({
          tvlChange: Math.round(tvlChange * 100) / 100, // Round to 2 decimal places
          claimsToday,
          riddleSolves,
        });
      } catch (error) {
        console.error('Error fetching stats preview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [readContract, getTotalValueLocked, getGiftCount, getGift]);

  return { stats, loading };
}

