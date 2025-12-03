import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        {/* REQUIRED */}
        <meta property="og:card" content="app" />

        {/* BASE MINI APP EMBED (100% VALID) */}
        <meta
          name="fc:miniapp"
          content='{
            "version": "1",
            "imageUrl": "https://riddlepay.tech/og-image.png",
            "button": {
              "title": "Try RiddlePay",
              "action": {
                "type": "launch_frame",
                "name": "open",
                "url": "https://riddlepay.tech"
              }
            }
          }'
        />

        {/* OG Meta */}
        <meta property="og:title" content="RiddlePay" />
        <meta
          property="og:description"
          content="Send secret crypto airdrops unlocked by riddles on Base Network."
        />
        <meta property="og:image" content="https://riddlepay.tech/og-image.png" />
        <meta property="og:url" content="https://riddlepay.tech" />

        {/* Fonts - Optimized with preload */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          media="print"
          onLoad="this.media='all'"
        />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://api.coingecko.com" />
        <link rel="dns-prefetch" href="https://basescan.org" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/icon.png" as="image" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
