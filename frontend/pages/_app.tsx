import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  // Call sdk.actions.ready() for Base/Farcaster mini app (per docs)
  // https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Force dark theme immediately to override Mini App injected styles
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');

    let cancelled = false;

    const markReady = async () => {
      try {
        // Dynamically import the SDK on the client only (lazy load for faster initial render)
        const { sdk } = await import('@farcaster/miniapp-sdk');

        // Wait for our app to be painted and layout ready
        // Then tell the Mini App host we're ready to show content
        await sdk.actions.ready();

        if (!cancelled) {
          console.log('✅ RiddlePay mini app called sdk.actions.ready()');
        }
      } catch (error) {
        // Not a Farcaster Mini App, that's okay
        console.log('[RiddlePay] Not running as Farcaster Mini App');
      }
    };

    // Use microtask for immediate execution without blocking render
    Promise.resolve().then(() => {
      void markReady();
    });

    return () => {
      cancelled = true;
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

