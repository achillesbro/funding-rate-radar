import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FujiScan - Funding Radar',
  description: 'Perpetual funding rates across major exchanges with value context',
  icons: {
    icon: '/FujiScan-Favicon.png',
    shortcut: '/FujiScan-Favicon.png',
    apple: '/FujiScan-Favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-vignette">{children}</body>
    </html>
  )
}
