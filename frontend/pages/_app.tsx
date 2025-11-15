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

    const markReady = async (retryCount = 0) => {
      // Prevent multiple calls
      if (readyCalled || cancelled) return;
      
      try {
        // Log current domain for debugging
        const currentDomain = window.location.hostname;
        if (!cancelled && retryCount === 0) {
          console.log(`[RiddlePay] Current domain: ${currentDomain}`);
          console.log(`[RiddlePay] Expected domain: www.riddlepay.tech`);
        }

        // Import Farcaster Mini App SDK (Base uses this)
        const { sdk } = await import('@farcaster/miniapp-sdk');

        // Check if SDK and actions are available
        if (!sdk || !sdk.actions || typeof sdk.actions.ready !== 'function') {
          throw new Error('SDK actions.ready is not available');
        }

        // IMPORTANT: Call ready() - MUST be awaited for Base Mini Apps
        // This tells the host app that UI is ready and splash screen can be hidden
        await sdk.actions.ready();
        readyCalled = true;

        if (!cancelled) {
          console.log('✅ RiddlePay Mini App called sdk.actions.ready() successfully');
          console.log(`✅ Domain: ${currentDomain}`);
        }
      } catch (error: any) {
        // Log detailed error for debugging
        if (!cancelled && retryCount === 0) {
          console.error('[RiddlePay] SDK ready() error:', error);
          console.error('[RiddlePay] Error details:', {
            message: error?.message,
            stack: error?.stack,
            domain: window.location.hostname,
            href: window.location.href
          });
        }

        // Retry up to 3 times if SDK not ready yet
        if (retryCount < 3 && !cancelled) {
          console.log(`[RiddlePay] Retrying sdk.actions.ready() (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            if (!cancelled && !readyCalled) {
              void markReady(retryCount + 1);
            }
          }, 500 * (retryCount + 1)); // Exponential backoff: 500ms, 1000ms, 1500ms
        } else if (!cancelled) {
          // Not running as a Mini App (standalone browser) - this is okay
          console.log('[RiddlePay] Running in standalone mode (not as Mini App):', error?.message || error);
        }
      }
    };

    // Try calling ready() immediately
    void markReady();

    // Also try after page is fully loaded (fallback)
    const handleLoad = () => {
      if (!readyCalled && !cancelled) {
        void markReady();
      }
    };

    if (document.readyState === 'complete') {
      // Page already loaded, try immediately
      setTimeout(() => void markReady(), 0);
    } else {
      window.addEventListener('load', handleLoad);
    }

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
          <meta property="og:url" content="https://www.riddlepay.tech" />
          <meta property="og:image" content="https://www.riddlepay.tech/og-image.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="RiddlePay" />
          <meta name="twitter:description" content="Send secret crypto gifts unlocked by riddles on Base Network" />
          <meta name="twitter:image" content="https://www.riddlepay.tech/og-image.png" />
          {/* Farcaster/Base Mini App embed metadata */}
          <meta name="fc:frame" content="vNext" />
          <link rel="icon" type="image/png" href="https://www.riddlepay.tech/icon.png" />
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

