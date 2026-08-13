import type { MetadataRoute } from 'next'
import { serverClient } from '../lib/supabase'

// Rebuilt hourly. Every published page earns a place; drafts do not.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://relayme.bio'
  const now = new Date()

  const fixed: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: base + '/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: base + '/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const sb = serverClient()
    const { data } = await sb
      .from('pages')
      .select('username, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(5000)

    const pages: MetadataRoute.Sitemap = (data || []).map((p: any) => ({
      url: base + '/' + p.username,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return fixed.concat(pages)
  } catch (e) {
    // a sitemap missing its dynamic half beats a sitemap that 500s
    return fixed
  }
}
