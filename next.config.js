/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: true, // For static exports if needed
  },
  // Enable static exports for better performance
  output: 'standalone',
  // Optimize for Vercel
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  // Headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
