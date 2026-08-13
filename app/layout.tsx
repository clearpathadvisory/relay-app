import './globals.css'
import type { Metadata } from 'next'

const DESC =
  'Build a link page people actually want to tap. Unlimited links on every plan, your own photo, social icons, tap statistics and forty themes. Free to start.'

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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=DM+Sans:wght@400;600;700&family=Space+Mono:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Nunito:wght@400;600;700;800&family=Shantell+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
