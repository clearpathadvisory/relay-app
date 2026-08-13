import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private surfaces and machinery — nothing here belongs in an index,
        // and crawling them wastes budget that should go on real pages.
        disallow: ['/dashboard', '/login', '/auth/', '/api/', '/monitoring'],
      },
    ],
    sitemap: 'https://relayme.bio/sitemap.xml',
    host: 'https://relayme.bio',
  }
}
