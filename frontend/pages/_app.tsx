import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Disable Pull-To-Refresh in Base App
// This prevents the Base App from reloading the mini app when scrolling up
function disablePullToRefresh() {
  let lastY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    lastY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const y = e.touches[0].clientY;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    // If user scrolls UP hard from the top → prevent refresh
    if (y > lastY && scrollTop === 0) {
      e.preventDefault();
    }

    lastY = y;
  };

  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });

  return () => {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
  };
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function initMiniApp() {
      try {
        // ✅ Load SDK dynamically (required for Warpcast/Base)
        const { sdk } = await import("@farcaster/miniapp-sdk");

        // ✅ Always call ready() — do NOT conditionally check iframe
        await sdk.actions.ready();

        console.log("✅ Mini App sdk.actions.ready() executed successfully");
      } catch (err) {
        // This fires when you're running outside Warpcast/Base App
        console.warn("⚠️ Mini App ready() skipped (not inside Warpcast/Base)", err);
      }
    }

    initMiniApp();

    // Disable pull-to-refresh to prevent Base App from reloading the mini app
    const cleanup = disablePullToRefresh();

    return () => {
      cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <Head>
            <title>RiddlePay</title>

            {/* Viewport settings for mobile keyboard handling */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

            {/* Prevent pull-to-refresh on mobile */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />

            {/* REQUIRED for Warpcast Mini App */}
            <meta name="farcaster-mini-app" content="v1" />

            {/* OG Metadata */}
            <meta name="description" content="RiddlePay - Secret crypto gifts unlocked by riddles." />
            <meta property="og:title" content="RiddlePay" />
            <meta property="og:description" content="Send secret crypto gifts unlocked by riddles on Base Network." />
            <meta property="og:image" content="https://riddlepay.tech/og-image.png" />
            <meta property="og:url" content="https://riddlepay.tech" />

            {/* Icon */}
            <link rel="icon" type="image/png" href="https://riddlepay.tech/icon.png" />
          </Head>

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

          <Component {...pageProps} />
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
