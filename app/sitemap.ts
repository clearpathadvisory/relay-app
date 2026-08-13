import type { MetadataRoute } from 'next'
import { serverClient } from '../lib/supabase'

// Rebuilt hourly. Every published page with something on it earns a place;
// drafts and empty pages do not — a few thousand blank profiles is a quality
// signal working against the whole domain.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://relayme.bio'
  const now = new Date()

  const fixed: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: base + '/vs-linktree', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: base + '/terms', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const sb = serverClient()
    const { data } = await sb
      .from('pages')
      .select('id, username, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(5000)

    const rows = data || []
    if (!rows.length) return fixed

    const { data: linked } = await sb
      .from('links')
      .select('page_id')
      .eq('is_active', true)
      .eq('kind', 'link')
      .in('page_id', rows.map((p: any) => p.id))

    const hasLinks: any = {}
    ;(linked || []).forEach((l: any) => { hasLinks[l.page_id] = true })

    const pages: MetadataRoute.Sitemap = rows
      .filter((p: any) => hasLinks[p.id])
      .map((p: any) => ({
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
