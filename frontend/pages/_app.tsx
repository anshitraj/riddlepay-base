import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  // Call sdk.actions.ready() for Base/Farcaster Mini App (REQUIRED)
  // This tells Base App that the UI is ready and splash screen can be hidden
  // Base Mini Apps use the Farcaster SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Force dark theme immediately to override Mini App injected styles
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');

    let cancelled = false;
    let readyCalled = false;

    // Detect if we're in Base App or Base preview
    const detectBaseContext = () => {
      if (typeof window === 'undefined') return false;
      const anyWindow = window as any;
      const href = window.location.href;
      const hostname = window.location.hostname;
      
      // Check for Base App indicators
      const isBaseApp = (
        hostname.includes('base.dev') ||
        hostname.includes('base.org') ||
        href.includes('base.dev/preview') ||
        !!(anyWindow.base) ||
        !!(anyWindow.coinbaseWalletSDK) ||
        !!(anyWindow.ethereum?.isCoinbaseWallet) ||
        navigator.userAgent.includes('Base') ||
        (window.parent !== window && (window.parent as any).base)
      );
      
      return isBaseApp;
    };

    const markReady = async (retryCount = 0) => {
      // Prevent multiple calls
      if (readyCalled || cancelled) return;
      
      try {
        // Log current domain for debugging
        const currentDomain = window.location.hostname;
        const isBase = detectBaseContext();
        if (!cancelled && retryCount === 0) {
          console.log(`[RiddlePay] Current domain: ${currentDomain}`);
          console.log(`[RiddlePay] Expected domain: riddlepay.tech`);
          console.log(`[RiddlePay] User agent: ${navigator.userAgent}`);
          console.log(`[RiddlePay] Is Base context: ${isBase}`);
          console.log(`[RiddlePay] Checking for Base/Farcaster context...`);
        }

        // Import Farcaster Mini App SDK (Base App uses this SDK too)
        const { sdk } = await import('@farcaster/miniapp-sdk');

        // Check if SDK and actions are available
        if (!sdk || !sdk.actions || typeof sdk.actions.ready !== 'function') {
          throw new Error('SDK actions.ready is not available');
        }

        // IMPORTANT: Call ready() - MUST be awaited for Base/Farcaster Mini Apps
        // This tells the host app that UI is ready and splash screen can be hidden
        // Base App requires this call to hide the splash screen
        await sdk.actions.ready();
        readyCalled = true;

        if (!cancelled) {
          console.log('✅ RiddlePay Mini App called sdk.actions.ready() successfully');
          console.log(`✅ Domain: ${currentDomain}`);
          console.log(`✅ Is Base context: ${isBase}`);
          console.log(`✅ Splash screen should now be hidden`);
        }
      } catch (error: any) {
        // Log detailed error for debugging
        if (!cancelled && retryCount === 0) {
          console.error('[RiddlePay] SDK ready() error:', error);
          console.error('[RiddlePay] Error details:', {
            message: error?.message,
            stack: error?.stack,
            domain: window.location.hostname,
            href: window.location.href,
            userAgent: navigator.userAgent,
            isBase: detectBaseContext(),
            sdkAvailable: typeof window !== 'undefined' && !!(window as any).farcaster
          });
        }

        // Retry up to 8 times if SDK not ready yet (Base App preview might need more time)
        if (retryCount < 8 && !cancelled) {
          const delay = 250 * (retryCount + 1); // 250ms, 500ms, 750ms, 1000ms, 1250ms, 1500ms, 1750ms, 2000ms
          console.log(`[RiddlePay] Retrying sdk.actions.ready() (attempt ${retryCount + 1}/8) in ${delay}ms...`);
          setTimeout(() => {
            if (!cancelled && !readyCalled) {
              void markReady(retryCount + 1);
            }
          }, delay);
        } else if (!cancelled) {
          // Not running as a Mini App (standalone browser) - this is okay
          console.log('[RiddlePay] Running in standalone mode (not as Mini App):', error?.message || error);
        }
      }
    };

    // Multiple strategies to ensure ready() is called for Base App
    // Base App preview might need the SDK to be available before calling ready()
    
    // Strategy 1: Try immediately (for fast-loading apps)
    void markReady();

    // Strategy 2: Try after DOM is ready (Base App might need this)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!readyCalled && !cancelled) {
          console.log('[RiddlePay] DOMContentLoaded: Attempting sdk.actions.ready()...');
          void markReady();
        }
      });
    } else {
      // DOM already ready, try with small delay
      setTimeout(() => {
        if (!readyCalled && !cancelled) {
          console.log('[RiddlePay] DOM already ready: Attempting sdk.actions.ready()...');
          void markReady();
        }
      }, 50);
    }

    // Strategy 3: Try after page is fully loaded (fallback for Base App)
    const handleLoad = () => {
      if (!readyCalled && !cancelled) {
        console.log('[RiddlePay] Window load event: Attempting sdk.actions.ready()...');
        void markReady();
      }
    };

    if (document.readyState === 'complete') {
      // Page already loaded, try immediately with a small delay for Base App
      setTimeout(() => {
        if (!readyCalled && !cancelled) {
          console.log('[RiddlePay] Page complete: Attempting sdk.actions.ready()...');
          void markReady();
        }
      }, 100);
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Strategy 4: Additional fallbacks with increasing delays (Base App preview needs this)
    [200, 500, 1000, 2000].forEach((delay) => {
      setTimeout(() => {
        if (!readyCalled && !cancelled) {
          console.log(`[RiddlePay] Fallback (${delay}ms): Attempting sdk.actions.ready()...`);
          void markReady();
        }
      }, delay);
    });

    // Strategy 5: Use requestAnimationFrame for Base App (ensures UI is rendered)
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!readyCalled && !cancelled) {
          console.log('[RiddlePay] requestAnimationFrame: Attempting sdk.actions.ready()...');
          void markReady();
        }
      }, 100);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Head>
          <title>RiddlePay</title>
          <meta name="description" content="RiddlePay - Send secret crypto gifts unlocked by riddles on Base Network" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="keywords" content="riddlepay, crypto gifts, blockchain, base network, riddles, ethereum" />
          <meta property="og:title" content="RiddlePay" />
          <meta property="og:description" content="Send secret crypto gifts unlocked by riddles on Base Network" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://riddlepay.tech" />
          <meta property="og:image" content="https://riddlepay.tech/og-image.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="RiddlePay" />
          <meta name="twitter:description" content="Send secret crypto gifts unlocked by riddles on Base Network" />
          <meta name="twitter:image" content="https://riddlepay.tech/og-image.png" />
          {/* Farcaster/Base Mini App embed metadata - REQUIRED for Base App display */}
          <meta name="fc:frame" content="vNext" />
          <meta
            name="fc:miniapp"
            content={JSON.stringify({
              version: 'next',
              imageUrl: 'https://riddlepay.tech/og-image.png',
              button: {
                title: 'Launch RiddlePay',
                action: {
                  type: 'launch_miniapp',
                  name: 'RiddlePay',
                  url: 'https://riddlepay.tech',
                  splashImageUrl: 'https://riddlepay.tech/splash.png',
                  splashBackgroundColor: '#000000',
                },
              },
            })}
          />
          <link rel="icon" type="image/png" href="https://riddlepay.tech/icon.png" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="alternate icon" href="/favicon.svg" />
        </Head>
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(11, 13, 23, 0.95)',
              color: '#fff',
              border: '1px solid rgba(0, 82, 255, 0.3)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            },
            success: {
              iconTheme: {
                primary: '#0052FF',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Component {...pageProps} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

