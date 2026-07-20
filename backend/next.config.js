/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
        ],
      },
    ];
  },
  // The Angular build is copied into public/ at build time (see package.json's
  // vercel-build script). Everything that isn't an API route or an existing
  // static file falls back to Angular's index.html so client-side routing
  // (e.g. /izvodjac/123) works on direct navigation/refresh, not just clicks
  // within the SPA.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [{ source: '/:path*', destination: '/index.html' }],
    };
  },
};

module.exports = nextConfig;
