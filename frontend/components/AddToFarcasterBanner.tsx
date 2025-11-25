'use client';

import { useState, useEffect } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AddToFarcasterBanner() {
  const { isInMiniApp, isConnected } = useWallet();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sdk, setSdk] = useState<any>(null);

  // Load Farcaster SDK
  useEffect(() => {
    if (isInMiniApp && isConnected) {
      import('@farcaster/miniapp-sdk').then((module) => {
        setSdk(module.sdk);
      }).catch((err) => {
        console.error('Error loading Farcaster SDK:', err);
      });
    }
  }, [isInMiniApp, isConnected]);

  // Show banner if in Farcaster, connected, and not dismissed
  useEffect(() => {
    if (isInMiniApp && isConnected && !dismissed) {
      // Check if user has dismissed before or already added
      const hasDismissed = localStorage.getItem('add_to_farcaster_dismissed');
      const alreadyAdded = localStorage.getItem('miniapp_already_added');
      if (!hasDismissed && !alreadyAdded) {
        // Show after a short delay
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // If already dismissed or added, don't show
        setShowBanner(false);
      }
    } else {
      setShowBanner(false);
    }
  }, [isInMiniApp, isConnected, dismissed]);

  const handleAddToFarcaster = async () => {
    try {
      // Always try to load SDK fresh to ensure it's initialized
      const { sdk: farcasterSDK } = await import('@farcaster/miniapp-sdk');
      await farcasterSDK.actions.ready();
      
      // Try to add to home screen
      try {
        await farcasterSDK.actions.addToHomeScreen();
        // Success - hide banner
        setShowBanner(false);
        setDismissed(true);
        localStorage.setItem('add_to_farcaster_dismissed', 'true');
        localStorage.setItem('miniapp_already_added', 'true');
        toast.success('Added to Farcaster home! 🎉');
      } catch (addError: any) {
        // Check if it's already added or other error
        const errorMessage = addError?.message || addError?.toString() || '';
        console.log('Add to home screen error:', errorMessage);
        
        if (
          errorMessage.includes('already') ||
          errorMessage.includes('added') ||
          errorMessage.includes('exists') ||
          errorMessage.includes('duplicate')
        ) {
          toast.success('Mini app is already added to your Farcaster home!');
          setShowBanner(false);
          setDismissed(true);
          localStorage.setItem('add_to_farcaster_dismissed', 'true');
          localStorage.setItem('miniapp_already_added', 'true');
        } else {
          // If the action doesn't exist or fails, provide helpful message
          toast.error('Unable to add to home screen. You can add it manually from the menu.');
          console.error('Add to home screen failed:', addError);
        }
      }
    } catch (err: any) {
      console.error('Error with Farcaster SDK:', err);
      // If SDK fails entirely, show helpful message
      toast.error('Unable to add to home screen. Please try from the Farcaster menu.');
    }
  };

  const handleShare = async () => {
    // Use Farcaster mini app link
    const url = 'https://farcaster.xyz/miniapps/uWGKfkq7RRal/riddlepay';
    const shareData = {
      title: 'RiddlePay - Secret Crypto Airdrops',
      text: 'Send secret crypto airdrops unlocked by riddles on Base Network',
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (err: any) {
      // User cancelled or error
      if (err.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        } catch (clipboardErr) {
          toast.error('Failed to share');
        }
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('add_to_farcaster_dismissed', 'true');
  };

  if (!isInMiniApp || !isConnected || dismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-purple-400/30 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-0.5">
                  Add RiddlePay to your Farcaster home?
                </h3>
                <p className="text-xs sm:text-sm text-white/80">
                  Quick access to your secret airdrops
                </p>
                <a 
                  href="https://farcaster.xyz/miniapps/uWGKfkq7RRal/riddlepay" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-white/60 hover:text-white/80 underline mt-1 inline-block"
                >
                  View on Farcaster
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleShare}
                className="p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Share RiddlePay"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <button
                onClick={handleAddToFarcaster}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-purple-600 font-semibold rounded-lg hover:bg-white/90 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Add
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Dismiss"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

