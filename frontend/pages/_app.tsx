import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// IMPORTANT: import SDK normally (no dynamic import)
import { sdk } from '@farcaster/miniapp-sdk';

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    // Only call ready() when running inside a mini-app container
    const inMiniApp = window.parent !== window;

    if (inMiniApp) {
      sdk.actions.ready().then(() => {
        console.log("✅ Mini App ready() called successfully");
      }).catch((e) => {
        console.error("❌ Mini App ready() failed:", e);
      });
    }

  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Head>
          <title>RiddlePay</title>

          {/* IMPORTANT FOR MINI APP DETECTION */}
          <meta name="farcaster-mini-app" content="v1" />

          {/* Your OG tags */}
          <meta name="description" content="RiddlePay - Send secret crypto gifts unlocked by riddles on Base Network" />
          <meta property="og:title" content="RiddlePay" />
          <meta property="og:description" content="Send secret crypto gifts unlocked by riddles on Base Network" />
          <meta property="og:image" content="https://riddlepay.tech/og-image.png" />
          <meta property="og:url" content="https://riddlepay.tech" />

          {/* Icons */}
          <link rel="icon" type="image/png" href="https://riddlepay.tech/icon.png" />
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
          }}
        />

        <Component {...pageProps} />

      </ThemeProvider>
    </ErrorBoundary>
  );
}
