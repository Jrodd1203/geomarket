import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GeoMarket',
  description: 'Geopolitical intelligence dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full overflow-hidden bg-[#030712]">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
