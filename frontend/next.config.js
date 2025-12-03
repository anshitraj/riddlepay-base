/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  compress: true,

  // ❗ IMPORTANT: Disable Next.js image optimization
  // This prevents PNG → AVIF/WEBP conversion that breaks Farcaster/Base
  images: {
    unoptimized: true,
  },

  swcMinify: true,
  
  // Performance optimizations
  poweredByHeader: false,

  webpack: (config, { isServer, dev }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Fix html5-qrcode SSR issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('html5-qrcode');
    }

    // Optimized chunk splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,

            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },

            ethers: {
              name: "ethers",
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              chunks: "all",
              priority: 30,
            },

            framerMotion: {
              name: "framer-motion",
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              chunks: "all",
              priority: 25,
            },

            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // ❗ REQUIRED HEADERS FOR FARCASTER + BASE
  async headers() {
    return [
      // Allow Farcaster to fetch your JSON manifest
      {
        source: '/.well-known/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' },
        ],
      },

      // ❗ CRITICAL: Serve OG image strictly as PNG
      {
        source: '/og-image.png',
        headers: [
          { key: 'Content-Type', value: 'image/png' },
        ],
      },

      // Allow mini-app iframe embedding & remove X-Frame-Options issue
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },

  // Performance: Add caching for static assets
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
