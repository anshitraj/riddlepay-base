import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  // Call sdk.actions.ready() for Base/Farcaster mini app
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const callReady = () => {
      try {
        // Try different SDK locations that Base/Farcaster might use
        const win = window as any;
        
        // Method 1: window.farcaster.sdk.actions.ready()
        if (win.farcaster?.sdk?.actions?.ready) {
          win.farcaster.sdk.actions.ready();
          console.log('✅ Called farcaster.sdk.actions.ready()');
          return true;
        }
        
        // Method 2: window.sdk.actions.ready()
        if (win.sdk?.actions?.ready) {
          win.sdk.actions.ready();
          console.log('✅ Called sdk.actions.ready()');
          return true;
        }
        
        // Method 3: Direct access via window.farcaster.actions.ready()
        if (win.farcaster?.actions?.ready) {
          win.farcaster.actions.ready();
          console.log('✅ Called farcaster.actions.ready()');
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error calling SDK ready():', error);
        return false;
      }
    };

    // Try immediately
    if (callReady()) {
      return;
    }

    // If SDK not ready, wait and retry multiple times
    let retryCount = 0;
    const maxRetries = 10;
    
    const retryInterval = setInterval(() => {
      retryCount++;
      
      if (callReady()) {
        clearInterval(retryInterval);
        return;
      }
      
      if (retryCount >= maxRetries) {
        clearInterval(retryInterval);
        console.warn('⚠️ SDK ready() not called - SDK may not be available');
      }
    }, 200); // Check every 200ms
    
    return () => clearInterval(retryInterval);
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

