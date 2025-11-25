// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Disable pull-to-refresh gesture inside Base App WebView
function disablePullToRefresh() {
  let lastY = 0;

  const onTouchStart = (e: TouchEvent) => {
    lastY = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;

    // If user is at top & scrolling up → Block refresh
    if (window.scrollY === 0 && currentY > lastY) {
      e.preventDefault();
    }

    lastY = currentY;
  };

  document.addEventListener("touchstart", onTouchStart, { passive: false });
  document.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchmove", onTouchMove);
  };
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Mini App SDK
    async function init() {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
      } catch (err) {
        console.warn("Not inside Base/Warpcast Mini App");
      }
    }

    init();

    // Disable pull-to-refresh
    const cleanup = disablePullToRefresh();
    return () => cleanup();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <Head>
            <title>RiddlePay</title>

            {/* Prevent refresh on scroll */}
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
            />

            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />

            {/* REQUIRED for Farcaster Mini App */}
            <meta name="farcaster-mini-app" content="v1" />

            {/* OG Meta */}
            <meta name="description" content="RiddlePay - Send secret crypto gifts unlocked by riddles." />
            <meta property="og:title" content="RiddlePay" />
            <meta property="og:description" content="RiddlePay - Send secret crypto gifts unlocked by riddles on Base." />
            <meta property="og:image" content="https://riddlepay.tech/og-image.png" />
            <meta property="og:url" content="https://riddlepay.tech" />

            <link rel="icon" href="https://riddlepay.tech/icon.png" />
          </Head>

          {/* ⚠️ INTERNAL SCROLL AREA ONLY */}
          <div id="miniapp-container">
            <Component {...pageProps} />
          </div>

          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(11, 13, 23, 0.95)",
                color: "#fff",
                border: "1px solid rgba(0, 82, 255, 0.3)",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
              },
            }}
          />
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
