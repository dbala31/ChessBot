import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16.
  // Empty config silences the webpack-only warning.
  turbopack: {
    resolveAlias: {
      // stockfish.js uses require('fs') / require('path') behind Node guards.
      // These never execute in the browser but the bundler still resolves them.
      fs: { browser: './src/lib/stubs/empty.js' },
      path: { browser: './src/lib/stubs/empty.js' },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    return config
  },
  async headers() {
    return [
      {
        // Scope COOP/COEP to pages that need SharedArrayBuffer (Stockfish WASM).
        // Applying globally can break Supabase auth popups and third-party embeds.
        source: '/games/:id*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
      {
        source: '/train/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
      {
        source: '/settings/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ]
  },
}

export default nextConfig
