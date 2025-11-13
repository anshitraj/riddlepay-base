'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (address: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const startScanning = async () => {
      try {
        setError(null);
        setScanning(true);
        
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Validate if it's an Ethereum address
            if (/^0x[a-fA-F0-9]{40}$/.test(decodedText)) {
              html5QrCode.stop();
              onScan(decodedText);
              onClose();
            } else if (decodedText.startsWith('ethereum:')) {
              // Handle ethereum: URI scheme
              const address = decodedText.split(':')[1]?.split('?')[0];
              if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
                html5QrCode.stop();
                onScan(address);
                onClose();
              }
            }
          },
          (errorMessage) => {
            // Ignore errors - they're expected during scanning
          }
        );
      } catch (err: any) {
        console.error('QR Scanner error:', err);
        setError(err.message || 'Failed to start camera');
        setScanning(false);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore stop errors
        });
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-baseLight/95 dark:bg-white/95 backdrop-blur-xl rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white dark:text-gray-900">Scan QR Code</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </button>
          </div>

          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <p className="text-sm text-gray-400 dark:text-gray-600">
                Please allow camera access and try again
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                id="qr-reader"
                className="w-full rounded-xl overflow-hidden bg-black"
                style={{ minHeight: '300px' }}
              />
              <p className="text-xs text-center text-gray-400 dark:text-gray-600">
                Point your camera at a wallet address QR code
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

