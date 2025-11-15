import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        {/* REQUIRED for Farcaster + Base Mini Apps */}
        <meta name="farcaster-mini-app" content="v1" />

        {/* OG + social preview (optional but good) */}
        <meta property="og:title" content="RiddlePay" />
        <meta property="og:description" content="Send secret crypto gifts unlocked by riddles on Base Network" />
        <meta property="og:image" content="https://riddlepay.tech/og-image.png" />
        <meta property="og:url" content="https://riddlepay.tech" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
