'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Clock, CheckCircle } from 'lucide-react';
import { formatAmount } from '@/utils/formatAmount';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  receiver: string;
  amount: string;
  tokenAddress: string;
  isETH: boolean;
  hasRiddle: boolean;
  unlockTime: string;
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  receiver,
  amount,
  tokenAddress,
  isETH,
  hasRiddle,
  unlockTime,
  loading = false,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open (modal is fixed, so no need to scroll page)
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll but allow modal content to scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unlockType = unlockTime 
    ? new Date(unlockTime).toLocaleString() 
    : 'Immediate';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center"
            style={{ 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              position: 'fixed'
            }}
          >
            {/* Modal */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-baseLight/95 dark:bg-white/95 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
              style={{ 
                marginBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white text-gray-900">
                    Confirm Gift Creation
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-baseLight/50 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 dark:text-white text-gray-900" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <div className="p-4 glass rounded-xl border border-border">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">You're about to send</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                    {formatAmount(amount, tokenAddress)}
                  </p>
                </div>

                <div className="p-4 glass rounded-xl border border-border">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">To address</p>
                  <p className="text-sm font-mono dark:text-white text-gray-900 break-all">
                    {receiver}
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 glass rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    {hasRiddle ? (
                      <>
                        <Gift className="w-4 h-4 text-blue-500" />
                        <span className="text-sm dark:text-white text-gray-900">Riddle Gift</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm dark:text-white text-gray-900">Direct Gift</span>
                      </>
                    )}
                  </div>
                  <div className="h-4 w-px bg-border"></div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm dark:text-white text-gray-900">Unlock: {unlockType}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 glass rounded-xl border border-border dark:text-white text-gray-900 font-semibold transition-all duration-200 hover:bg-baseLight/50 dark:hover:bg-white/20 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Proceed'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

