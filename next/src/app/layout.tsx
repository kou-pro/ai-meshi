import type { Metadata } from 'next'
import Providers from './providers'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Ai-meshi',
  description: 'AI Recipe Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <Navbar />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
