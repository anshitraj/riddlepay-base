'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';

export default function AddMiniAppPrompt() {
  const { isInMiniApp, isConnected } = useWallet();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show if in mini app environment, not connected, and not dismissed
    if (isInMiniApp && !isConnected && !dismissed) {
      // Check if user has dismissed before
      const hasDismissed = localStorage.getItem('miniapp_prompt_dismissed');
      if (!hasDismissed) {
        // Show after a short delay
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isInMiniApp, isConnected, dismissed]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('miniapp_prompt_dismissed', 'true');
  };

  if (!isInMiniApp || isConnected || dismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-br from-blue-600/95 to-purple-600/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-blue-400/30">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm mb-1">
                  Add RiddlePay to your Farcaster
                </h3>
                <p className="text-white/90 text-xs mb-3">
                  Tap the menu icon and select "Add to Farcaster" to save this mini app for quick access.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

