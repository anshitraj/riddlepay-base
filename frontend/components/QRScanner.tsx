'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (address: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [Html5QrcodeLib, setHtml5QrcodeLib] = useState<any>(null);

  // Dynamically load html5-qrcode only on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen && !Html5QrcodeLib) {
      // Use dynamic import with error handling
      import('html5-qrcode')
        .then((module) => {
          // html5-qrcode v2.3.8 exports structure
          // Try different possible export formats
          let Html5Qrcode = null;
          
          // Check for default export (most common)
          if (module.default) {
            Html5Qrcode = module.default;
          }
          // Check for named export Html5Qrcode
          else if ((module as any).Html5Qrcode) {
            Html5Qrcode = (module as any).Html5Qrcode;
          }
          // Check for Html5QrcodeScanner (older versions)
          else if ((module as any).Html5QrcodeScanner) {
            Html5Qrcode = (module as any).Html5QrcodeScanner;
          }
          // Check if module itself is the constructor
          else if (typeof module === 'function') {
            Html5Qrcode = module;
          }
          
          if (!Html5Qrcode) {
            console.error('Html5Qrcode module structure:', Object.keys(module));
            throw new Error('Html5Qrcode constructor not found in module');
          }
          
          // Verify it's a constructor function
          if (typeof Html5Qrcode !== 'function') {
            console.error('Html5Qrcode is not a function:', typeof Html5Qrcode);
            throw new Error('Html5Qrcode is not a constructor function');
          }
          
          setHtml5QrcodeLib(() => Html5Qrcode);
        })
        .catch((err) => {
          console.error('Failed to load html5-qrcode:', err);
          setError('QR scanner library failed to load. Please refresh the page.');
        });
    }
  }, [isOpen, Html5QrcodeLib]);

  useEffect(() => {
    if (!isOpen || !Html5QrcodeLib) return;

    let isMounted = true;
    const startScanning = async () => {
      try {
        setError(null);
        setScanning(true);
        
        // Wait for the DOM element to be available
        const element = document.getElementById('qr-reader');
        if (!element) {
          throw new Error('QR reader element not found');
        }

        // Create instance with proper error handling
        // html5-qrcode v2+ uses Html5Qrcode constructor
        // The constructor takes the element ID as a string
        let html5QrCode;
        try {
          html5QrCode = new Html5QrcodeLib('qr-reader');
          scannerRef.current = html5QrCode;
        } catch (constructorError: any) {
          console.error('Failed to create Html5Qrcode instance:', constructorError);
          throw new Error(`Failed to initialize QR scanner: ${constructorError.message}`);
        }

        // Start scanning with proper config
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string, result: any) => {
            if (!isMounted) return;
            
            // Validate if it's an Ethereum address
            if (/^0x[a-fA-F0-9]{40}$/.test(decodedText)) {
              html5QrCode.stop().then(() => {
                onScan(decodedText);
                onClose();
              }).catch(() => {
                onScan(decodedText);
                onClose();
              });
            } else if (decodedText.startsWith('ethereum:')) {
              // Handle ethereum: URI scheme
              const address = decodedText.split(':')[1]?.split('?')[0];
              if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
                html5QrCode.stop().then(() => {
                  onScan(address);
                  onClose();
                }).catch(() => {
                  onScan(address);
                  onClose();
                });
              }
            }
          },
          (errorMessage: string) => {
            // Ignore errors - they're expected during scanning
            // Only log if it's not a common scanning error
            if (!errorMessage.includes('NotFoundException') && 
                !errorMessage.includes('No MultiFormat Readers')) {
              console.debug('QR scan error (ignored):', errorMessage);
            }
          }
        );
      } catch (err: any) {
        console.error('QR Scanner error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to start camera. Please ensure camera permissions are granted.');
          setScanning(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanning();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore stop errors
        });
        scannerRef.current = null;
      }
    };
  }, [isOpen, Html5QrcodeLib, onScan, onClose]);

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

