import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = {
  turbopack: {},
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://telegram.org",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://api.telegram.org",
            "frame-ancestors 'none'",
          ].join('; '),
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
}

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
})(nextConfig)
