'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import { useContract, Gift } from '@/hooks/useContract';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

// Dynamically import heavy components
const GiftCard = dynamic(() => import('@/components/GiftCard'), {
  loading: () => (
    <div className="glass rounded-2xl p-6 border border-border animate-pulse">
      <div className="h-32 bg-gray-700/30 rounded mb-4"></div>
      <div className="h-6 bg-gray-700/30 rounded w-3/4"></div>
    </div>
  ),
});

const ClaimGift = dynamic(() => import('@/components/ClaimGift'), {
  loading: () => (
    <div className="glass rounded-2xl p-6 border border-border animate-pulse">
      <div className="h-8 bg-gray-700/30 rounded w-1/2 mb-4"></div>
      <div className="h-24 bg-gray-700/30 rounded"></div>
    </div>
  ),
});

function MyGiftsContent() {
  const { address, connect } = useWallet();
  const { getGiftsForUser, getGift } = useContract();
  
  const [gifts, setGifts] = useState<Array<{ id: number; gift: Gift }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    retryCountRef.current = 0; // Reset retry count when effect runs
    const maxRetries = 3;
    
    const loadGifts = async (isRetry = false) => {
      if (!address) {
        setLoading(false);
        return;
      }

      // Only show loading spinner on initial load, not on retries
      if (!isRetry) {
        setLoading(true);
      }
      
      try {
        // Reduced timeout for faster feedback (8 seconds)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        );
        
        const giftIdsPromise = getGiftsForUser(address);
        const giftIds = await Promise.race([giftIdsPromise, timeoutPromise]) as number[];
        
        if (cancelled) return;
        
        if (giftIds.length === 0) {
          setGifts([]);
          setLoading(false);
          return;
        }
        
        // Limit to first 50 gifts to prevent hanging on large lists
        const limitedIds = giftIds.slice(0, 50);
        
        // Increased batch size for faster parallel fetching (20 at a time)
        const batchSize = 20;
        let allGiftsData: Array<{ id: number; gift: Gift }> = [];
        
        // Fetch all batches in parallel for maximum speed
        const allBatchPromises = [];
        
        for (let i = 0; i < limitedIds.length; i += batchSize) {
          if (cancelled) return;
          
          const batch = limitedIds.slice(i, i + batchSize);
          const batchPromise = Promise.all(
            batch.map(async (id) => {
              try {
                const gift = await Promise.race([
                  getGift(id),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Gift fetch timeout')), 3000) // Reduced to 3s
                  )
                ]) as Gift;
                
                if (cancelled) return null;
                return { id, gift };
              } catch (err) {
                console.warn(`Failed to load gift ${id}:`, err);
                return null;
              }
            })
          );
          
          allBatchPromises.push(batchPromise);
        }
        
        // Process batches and update UI progressively
        for (let i = 0; i < allBatchPromises.length; i++) {
          if (cancelled) return;
          
          const batchResults = await allBatchPromises[i];
          const validResults = batchResults.filter(
            (item): item is { id: number; gift: Gift } => item !== null
          );
          
          if (validResults.length > 0) {
            allGiftsData = [...allGiftsData, ...validResults];
            
            // Sort and update UI progressively (show results as they load)
            const sorted = [...allGiftsData].sort((a, b) => 
              Number(b.gift.createdAt) - Number(a.gift.createdAt)
            );
            
            setGifts(sorted);
            
            // Stop showing loading spinner once we have some results (progressive loading)
            if (sorted.length > 0) {
              setLoading(false);
            }
          }
        }
        
        if (cancelled) return;
        
        // Final sort by creation time (newest first)
        allGiftsData.sort((a, b) => 
          Number(b.gift.createdAt) - Number(a.gift.createdAt)
        );
        
        setGifts(allGiftsData);
        retryCountRef.current = 0; // Reset retry count on success
      } catch (err: any) {
        console.error('Error loading gifts:', err);
        if (!cancelled) {
          // Retry if we haven't exceeded max retries
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            console.log(`Retrying gift load (attempt ${retryCountRef.current}/${maxRetries})...`);
            setTimeout(() => {
              if (!cancelled) {
                loadGifts(true);
              }
            }, 1000 * retryCountRef.current); // Reduced backoff: 1s, 2s, 3s instead of 2s, 4s, 6s
            return; // Don't set loading to false yet
          } else {
            setGifts([]);
            setLoading(false);
          }
        }
      } finally {
        if (!cancelled && retryCountRef.current === 0) {
          setLoading(false);
        }
      }
    };

    loadGifts();
    
    // Reload data when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && address) {
        console.log('Page became visible, reloading gifts...');
        loadGifts(true);
      }
    };
    
    // Reload data when window gains focus
    const handleFocus = () => {
      if (address) {
        console.log('Window gained focus, reloading gifts...');
        loadGifts(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, refreshKey]); // getGiftsForUser and getGift are stable callbacks, don't need to be in deps

  const refreshGifts = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClaimClick = async (giftId: number) => {
    try {
      const gift = await getGift(giftId);
      setSelectedGift(gift);
      setSelectedGiftId(giftId);
    } catch (err) {
      console.error('Error loading gift:', err);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen dark:text-white text-gray-900 flex items-center justify-center relative z-10 bg-baseDark">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-8">
            <div className="text-7xl mb-6 animate-pulse">🔐</div>
            <h2 className="text-3xl font-bold dark:text-white text-gray-900 mb-4 bg-base-gradient bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="dark:text-gray-300 text-gray-700 mb-8 text-lg">
              Please connect your wallet to view and manage your airdrops
            </p>
          </div>
          <button
            onClick={connect}
            className="px-8 py-4 bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-baseBlue/50 active:scale-95 text-lg"
          >
            🔌 Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (selectedGiftId !== null && selectedGift) {
    return (
      <Layout>
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedGiftId(null);
              setSelectedGift(null);
            }}
            className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl dark:text-gray-300 dark:hover:text-white text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105 border border-border"
          >
            <span className="font-medium">← Back to My Airdrops</span>
          </button>
          <div className="glass rounded-2xl p-6 border border-border">
            <ClaimGift 
              giftId={selectedGiftId} 
              gift={selectedGift}
              onClaimSuccess={async () => {
                // Wait for blockchain to update (transaction confirmation + indexing)
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Refresh gifts multiple times to ensure we get updated state
                refreshGifts();
                setTimeout(() => refreshGifts(), 2000);
                setTimeout(() => refreshGifts(), 5000);
                
                // Go back to gift list after refresh
                setTimeout(() => {
                  setSelectedGiftId(null);
                  setSelectedGift(null);
                }, 6000);
              }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
              My Airdrops
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">View and manage your secret airdrops</p>
          </div>
          <button
            onClick={refreshGifts}
            disabled={loading}
            className="px-4 sm:px-5 py-2.5 min-h-[44px] glass rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 active:scale-95 border border-border touch-manipulation"
            title="Refresh gifts"
          >
            <RefreshCw className={`w-4 h-4 dark:text-white text-gray-900 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium dark:text-white text-gray-900 hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="dark:text-gray-400 text-gray-600 text-lg">Loading airdrops...</p>
          </div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📭</div>
            <p className="dark:text-white text-gray-900 text-xl mb-4 font-light">No airdrops found</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 glass-strong rounded-xl dark:text-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 glow-hover border border-border"
            >
              <span>Send your first airdrop</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {gifts.map(({ id, gift }) => (
              <GiftCard
                key={id}
                giftId={id}
                gift={gift}
                onClaim={() => handleClaimClick(id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function MyGifts() {
  return (
    <SearchProviderWrapper>
      <MyGiftsContent />
    </SearchProviderWrapper>
  );
}

