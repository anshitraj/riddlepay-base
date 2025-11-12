'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { useContract, Gift } from '@/hooks/useContract';
import ClaimGift from '@/components/ClaimGift';
import ThemeToggle from '@/components/ThemeToggle';
import { useRouter } from 'next/router';
import Link from 'next/link';

function ClaimContent() {
  const router = useRouter();
  const { giftId } = router.query;
  const { address } = useWallet();
  const { getGift } = useContract();
  
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGift = async () => {
      if (!giftId || typeof giftId !== 'string') {
        setLoading(false);
        return;
      }

      // Add a small delay to ensure contract is initialized
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        console.log('🔄 Loading gift with ID:', giftId);
        const giftData = await getGift(Number(giftId));
        console.log('✅ Gift loaded:', giftData);
        setGift(giftData);
        setError(null); // Clear any previous errors
      } catch (err: any) {
        console.error('❌ Error loading gift:', err);
        setError(err.message || 'Failed to load gift');
      } finally {
        setLoading(false);
      }
    };

    loadGift();
    
    // Refresh gift data periodically to catch state changes
    const interval = setInterval(() => {
      if (giftId && typeof giftId === 'string' && !loading) {
        loadGift();
      }
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [giftId, getGift, loading]);

  if (loading) {
    return (
      <div className="min-h-screen dark:text-white text-gray-900 flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <ThemeToggle />
          </div>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="dark:text-gray-400 text-gray-600 text-lg">Loading gift...</p>
        </div>
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen dark:text-white text-gray-900 relative z-10 bg-baseDark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <ThemeToggle />
            </div>
            <div className="mb-8">
              <div className="inline-block p-6 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
                <span className="text-6xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-3">Unable to Load Gift</h2>
              <p className="text-red-500 dark:text-red-400 mb-6 text-lg">{error || 'Gift not found'}</p>
              <p className="dark:text-gray-400 text-gray-600 text-sm mb-8">
                This might be due to a network issue or the gift may not exist.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 glass-strong rounded-xl dark:text-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 glow-hover border border-border">
                <span>← Back to Home</span>
              </Link>
              <Link href="/my-gifts" className="inline-flex items-center gap-2 px-8 py-4 glass rounded-xl dark:text-white text-gray-900 font-medium transition-all duration-300 hover:scale-105 border border-border">
                <span>View My Gifts</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:text-white text-gray-900 relative z-10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/my-gifts"
            className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-xl dark:text-gray-300 dark:hover:text-white text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105 border border-border"
          >
            <span>← Back to My Gifts</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="max-w-2xl mx-auto">
          <ClaimGift giftId={Number(giftId)} gift={gift} />
        </div>
      </div>
    </div>
  );
}

export default function Claim() {
  return (
    <WalletProvider>
      <ClaimContent />
    </WalletProvider>
  );
}

