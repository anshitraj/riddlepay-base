import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Head>
        <title>RiddlePay 🎁 | Unlock Crypto Gifts with Riddles</title>
        <meta name="description" content="RiddlePay - Send secret crypto gifts unlocked by riddles on Base Network" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="riddlepay, crypto gifts, blockchain, base network, riddles, ethereum" />
        <meta property="og:title" content="RiddlePay - Unlock Crypto Gifts with Riddles" />
        <meta property="og:description" content="Send secret crypto gifts unlocked by riddles on Base Network" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="🎁" />
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

