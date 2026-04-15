import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'AI飯',
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
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
