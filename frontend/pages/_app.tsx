import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  // Call sdk.actions.ready() for Base/Farcaster mini app (per docs)
  // https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const markReady = async () => {
      try {
        // Dynamically import the SDK on the client only
        const { sdk } = await import('@farcaster/miniapp-sdk');

        // Wait for our app to be painted and layout ready
        // Then tell the Mini App host we're ready to show content
        await sdk.actions.ready();

        if (!cancelled) {
          console.log('✅ RiddlePay mini app called sdk.actions.ready()');
        }
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };

    // Use nextTick to ensure initial render has happened
    const id = window.requestAnimationFrame(() => {
      void markReady();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, []);

  return (
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
  );
}

