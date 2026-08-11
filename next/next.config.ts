import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Cloudflare Workers では Next.js の画像最適化サーバーが動かないため
    // 最適化を無効にして原寸のまま配信する
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.aimeshi.com',
        pathname: '/rails/active_storage/**',
      },
      {
        protocol: 'http',
        hostname: 'rails',
        port: '3000',
        pathname: '/rails/active_storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/rails/active_storage/**',
      },
    ],
  },
}

export default nextConfig

initOpenNextCloudflareForDev()
