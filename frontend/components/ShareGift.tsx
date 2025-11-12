'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareGiftProps {
  giftId: number;
  onClose: () => void;
}

export default function ShareGift({ giftId, onClose }: ShareGiftProps) {
  const [copied, setCopied] = useState(false);
  
  const giftUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/claim?giftId=${giftId}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(giftUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`🎁 I just sent a secret crypto gift! Can you solve the riddle?`);
    const url = encodeURIComponent(giftUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToBaseApp = () => {
    // Base App share API (if available)
    if (typeof window !== 'undefined' && (window as any).BaseApp?.share) {
      (window as any).BaseApp.share({
        title: 'Secret Gift 🎁',
        text: 'I sent you a secret crypto gift!',
        url: giftUrl,
      });
    } else {
      copyToClipboard();
      toast.success('Link copied! Share it anywhere!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-baseLight/95 dark:bg-baseLight/80 rounded-2xl p-8 max-w-md w-full border border-baseBlue/20 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold bg-base-gradient bg-clip-text text-transparent">
              Share Gift #{giftId}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-baseBlue/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 dark:text-white text-gray-900" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-6 mb-6">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={giftUrl} size={200} />
            </div>
            
            <div className="w-full">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={giftUrl}
                  readOnly
                  className="flex-1 px-4 py-2 glass rounded-xl dark:text-white text-gray-900 text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-base-gradient text-white rounded-xl transition-all hover:scale-105"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={shareToTwitter}
              className="flex-1 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on X</span>
            </button>
            <button
              onClick={shareToBaseApp}
              className="flex-1 py-3 bg-base-gradient text-white font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

