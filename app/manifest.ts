import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Relay — one link for everything you make',
    short_name: 'Relay',
    description: 'Build a link page people actually want to tap.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FBFAF9',
    theme_color: '#7C5CE6',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
