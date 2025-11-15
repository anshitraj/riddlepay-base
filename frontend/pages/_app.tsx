// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Head>
          <title>RiddlePay</title>

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
      </ThemeProvider>
    </ErrorBoundary>
  );
}
