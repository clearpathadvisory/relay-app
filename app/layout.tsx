// Fonts are served from our own domain. Loading them from Google would hand
// every visitor's IP address to a third party before any consent exists.
import '@fontsource-variable/manrope'
import { MarketingAnalytics } from './analytics'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/nunito'
import '@fontsource-variable/shantell-sans'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'

import './globals.css'
import type { Metadata, Viewport } from 'next'

const DESC =
  'Build a link page people actually want to tap. Unlimited links on every plan, your own photo, social icons, tap statistics and 47 themes. Free to start.'

export const metadata: Metadata = {
  metadataBase: new URL('https://relayme.bio'),
  title: {
    default: 'Relay — one link for everything you make',
    template: '%s — Relay',
  },
  description: DESC,
  applicationName: 'Relay',
  keywords: ['link in bio', 'bio link', 'link page', 'linktree alternative', 'creator links', 'one link'],
  authors: [{ name: 'ClearPath Advisory' }],
  creator: 'ClearPath Advisory',
  publisher: 'ClearPath Advisory',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Relay',
    url: 'https://relayme.bio',
    title: 'Relay — one link for everything you make',
    description: DESC,
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image', title: 'Relay — one link for everything you make', description: DESC },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'technology',
  manifest: '/manifest.webmanifest',
  verification: { google: 'kVsSAKVGkkj-5X00u9M-wpnO4ZaWoiWfmQCBe71NgKQ' },
}

// Colours the browser chrome on a phone and stops iOS auto-darkening the UI.
export const viewport: Viewport = {
  themeColor: '#FBFAF9',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MarketingAnalytics />
      </body>
    </html>
  )
}
