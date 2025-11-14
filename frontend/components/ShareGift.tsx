'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#0E152B]/95 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-blue-500/20 shadow-lg relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[#0f172a] dark:text-white">
            Share Gift #{giftId}
          </h3>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-red-500/20 hover:bg-gray-200 dark:hover:bg-red-500/30 rounded-lg transition-colors duration-75 flex items-center justify-center border border-gray-200 dark:border-red-500/30"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#1e293b] dark:text-red-400" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 mb-6">
          <div className="p-4 bg-white dark:bg-[#0E152B]/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <QRCodeSVG value={giftUrl} size={200} />
          </div>
          
          <div className="w-full">
            <div className="flex gap-2">
              <input
                type="text"
                value={giftUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-white dark:bg-[#0E152B]/30 rounded-xl border border-gray-200 dark:border-gray-700 text-[#1e293b] dark:text-white text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 min-h-[44px] bg-[#eef2ff] dark:bg-base-gradient text-[#4f6ef7] dark:text-white rounded-xl border border-[#dce2ff] dark:border-transparent hover:bg-[#e4e8ff] dark:hover:opacity-90 transition-colors duration-75 flex items-center justify-center"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={shareToTwitter}
            className="flex-1 py-3 min-h-[44px] bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold rounded-xl transition-colors duration-75 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on X</span>
          </button>
          <button
            onClick={shareToBaseApp}
            className="flex-1 py-3 min-h-[44px] bg-[#eef2ff] dark:bg-base-gradient text-[#4f6ef7] dark:text-white font-semibold rounded-xl border border-[#dce2ff] dark:border-transparent hover:bg-[#e4e8ff] dark:hover:opacity-90 transition-colors duration-75 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

