/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,

  // Environment variables
  env: {
    // These are automatically loaded from .env files
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects (if needed)
  async redirects() {
    return [];
  },

  // Rewrites (if needed)
  async rewrites() {
    return {
      beforeFiles: [],
    };
  },

  // Build configuration
  typescript: {
    // Set to false to skip type checking in CI/CD
    // Set to true to fail on type errors
    tsconfigPath: './tsconfig.json',
  },

  // Images configuration
  images: {
    unoptimized: process.env.NODE_ENV === 'production' ? false : true,
    domains: [
      'localhost',
      'question-creator.olmedatech.com',
      'csgidstwiswdptalcqbt.supabase.co',
    ],
  },

  // Output configuration
  output: 'standalone', // Required for Docker standalone build

  // Experimental features
  experimental: {
    // optimizePackageImports: ['some-package'], // Uncomment if needed
  },
};

module.exports = nextConfig;
