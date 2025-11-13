'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import { useContract, Gift } from '@/hooks/useContract';
import ClaimGift from '@/components/ClaimGift';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

function ClaimContent() {
  const router = useRouter();
  const { giftId } = router.query;
  const { address } = useWallet();
  const { getGift } = useContract();
  
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;
    
    const loadGift = async () => {
      if (!giftId || typeof giftId !== 'string') {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        // Add timeout to prevent hanging (reduced from 15s to 5s for faster feedback)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );
        
        console.log('🔄 Loading gift with ID:', giftId);
        const giftDataPromise = getGift(Number(giftId));
        const giftData = await Promise.race([giftDataPromise, timeoutPromise]) as Gift;
        
        if (cancelled) return;
        
        console.log('✅ Gift loaded:', giftData);
        setGift(giftData);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error('❌ Error loading gift:', err);
        setError(err.message || 'Failed to load gift');
        setGift(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGift();
    
    // Refresh gift data periodically to catch state changes (only if not loading)
    intervalId = setInterval(() => {
      if (giftId && typeof giftId === 'string' && !loading) {
        loadGift();
      }
    }, 15000); // Refresh every 15 seconds (less frequent to avoid hanging)
    
    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftId]); // getGift is a stable callback, loading shouldn't be in deps

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400 dark:text-gray-600 text-lg">Loading airdrop...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !gift) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-block p-6 rounded-full bg-red-500/10 border border-red-500/30">
            <span className="text-6xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white dark:text-gray-900 mb-3">Unable to Load Airdrop</h2>
            <p className="text-red-500 dark:text-red-400 mb-6 text-lg">{error || 'Airdrop not found'}</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm">
              This might be due to a network issue or the airdrop may not exist.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div className="glass rounded-2xl p-4 sm:p-6 border border-border">
          <ClaimGift giftId={Number(giftId)} gift={gift} />
        </div>
      </div>
    </Layout>
  );
}

export default function Claim() {
  return (
    <WalletProvider>
      <SearchProviderWrapper>
        <ClaimContent />
      </SearchProviderWrapper>
    </WalletProvider>
  );
}

