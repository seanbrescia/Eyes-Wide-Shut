import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: {
    default: 'Eyes Wide Shut | Find the Move Tonight',
    template: '%s | Eyes Wide Shut',
  },
  description:
    'Discover the hottest bars, clubs, and events near you. RSVP, buy tickets, and see what\'s poppin\' tonight.',
  keywords: ['nightlife', 'bars', 'clubs', 'events', 'tickets', 'RSVP', 'college', 'nightout'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EWS',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
