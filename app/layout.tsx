import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Relay — one link, everything you make',
  description:
    'Build a link page people actually want to tap. Five links free, your own photo, and a proper preview of every site you point to.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=DM+Sans:wght@400;600;700&family=Space+Mono:wght@400;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
