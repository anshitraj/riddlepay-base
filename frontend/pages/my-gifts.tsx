'use client';

import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { useContract, Gift } from '@/hooks/useContract';
import GiftCard from '@/components/GiftCard';
import ClaimGift from '@/components/ClaimGift';
import WalletConnect from '@/components/WalletConnect';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

function MyGiftsContent() {
  const { address, connect } = useWallet();
  const { getGiftsForUser, getGift } = useContract();
  
  const [gifts, setGifts] = useState<Array<{ id: number; gift: Gift }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadGifts = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const giftIds = await getGiftsForUser(address);
        const giftPromises = giftIds.map(async (id) => {
          // Add retry logic to ensure we get the latest state
          let gift;
          let retries = 3;
          while (retries > 0) {
            try {
              gift = await getGift(id);
              break;
            } catch (err) {
              retries--;
              if (retries === 0) throw err;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          return { id, gift: gift! };
        });
        const giftsData = await Promise.all(giftPromises);
        
        // Sort by creation time (newest first)
        giftsData.sort((a, b) => 
          Number(b.gift.createdAt) - Number(a.gift.createdAt)
        );
        
        setGifts(giftsData);
      } catch (err) {
        console.error('Error loading gifts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGifts();
  }, [address, getGiftsForUser, getGift, refreshKey]);

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
          <div className="mb-8 flex justify-center">
            <ThemeToggle />
          </div>
          <div className="mb-8">
            <div className="text-7xl mb-6 animate-pulse">🔐</div>
            <h2 className="text-3xl font-bold dark:text-white text-gray-900 mb-4 bg-base-gradient bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="dark:text-gray-300 text-gray-700 mb-8 text-lg">
              Please connect your wallet to view and manage your gifts
            </p>
          </div>
          <button
            onClick={connect}
            className="px-8 py-4 bg-base-gradient text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-baseBlue/50 active:scale-95 text-lg"
          >
            🔌 Connect Wallet
          </button>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600 hover:dark:text-gray-300 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (selectedGiftId !== null && selectedGift) {
    return (
      <div className="min-h-screen dark:text-white text-gray-900 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                setSelectedGiftId(null);
                setSelectedGift(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl dark:text-gray-300 dark:hover:text-white text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105 border border-border"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to My Gifts</span>
            </button>
            <ThemeToggle />
          </div>
          <div className="max-w-2xl mx-auto">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:text-white text-gray-900 relative z-10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              My Gifts
            </h1>
            <p className="dark:text-gray-400 text-gray-600 text-sm">View and manage your secret gifts</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle />
            <button
              onClick={refreshGifts}
              disabled={loading}
              className="px-5 py-2.5 glass rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 hover:scale-105 border border-border"
              title="Refresh gifts"
            >
              <RefreshCw className={`w-4 h-4 dark:text-white text-gray-900 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium dark:text-white text-gray-900">Refresh</span>
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 glass-strong rounded-xl dark:text-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 border border-border"
            >
              ← Send New Gift
            </Link>
            <WalletConnect />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="dark:text-gray-400 text-gray-600 text-lg">Loading gifts...</p>
          </div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📭</div>
            <p className="dark:text-white text-gray-900 text-xl mb-4 font-light">No gifts found</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 glass-strong rounded-xl dark:text-white text-gray-900 font-semibold transition-all duration-300 hover:scale-105 glow-hover border border-border"
            >
              <span>Send your first gift</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}

export default function MyGifts() {
  return (
    <WalletProvider>
      <MyGiftsContent />
    </WalletProvider>
  );
}

