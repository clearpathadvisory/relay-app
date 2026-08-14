import { serverClient } from './supabase'

export type Faq = { q: string; a: string }

export type Post = {
  id: string
  slug: string
  title: string
  dek: string | null
  body_md: string
  category: string
  author_name: string
  meta_title: string | null
  meta_description: string | null
  cover_variant: number
  cover_override_url: string | null
  related_slugs: string[]
  faq: Faq[]
  status: string
  published_at: string | null
  updated_at: string
}

export const BLOG_BASE = 'https://relayme.bio'

// Only the columns a public page needs. body_md is heavy and the index does
// not read it.
const CARD_COLS =
  'id, slug, title, dek, category, author_name, cover_variant, cover_override_url, published_at, updated_at'
const FULL_COLS = CARD_COLS + ', body_md, meta_title, meta_description, related_slugs, faq, status'

// RLS already hides anything unpublished or future-dated from the anon key, so
// these queries do not repeat the condition. If a policy is ever loosened by
// accident, the filter below is the second lock.
function live(q: any) {
  return q.eq('status', 'published').lte('published_at', new Date().toISOString())
}

export async function listPosts(limit = 60): Promise<Post[]> {
  try {
    const { data } = await live(serverClient(true).from('posts').select(CARD_COLS))
      .order('published_at', { ascending: false })
      .limit(limit)
    return (data || []) as any
  } catch (e) {
    return []
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const { data } = await live(serverClient(true).from('posts').select(FULL_COLS))
      .eq('slug', slug)
      .limit(1)
    const row = (data || [])[0]
    return row ? (row as any) : null
  } catch (e) {
    return null
  }
}

export async function getPostsBySlugs(slugs: string[]): Promise<Post[]> {
  if (!slugs || !slugs.length) return []
  try {
    const { data } = await live(serverClient(true).from('posts').select(CARD_COLS)).in('slug', slugs)
    return (data || []) as any
  } catch (e) {
    return []
  }
}

export function categoriesOf(posts: Post[]): string[] {
  const seen: any = {}
  const out: string[] = []
  posts.forEach((p) => {
    if (p.category && !seen[p.category]) { seen[p.category] = true; out.push(p.category) }
  })
  return out.sort()
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function coverUrl(p: { slug: string; cover_override_url: string | null }): string {
  return p.cover_override_url || BLOG_BASE + '/blog/' + p.slug + '/cover'
}

// Six looks drawn from the site's own palette. A post keeps its number, so a
// cover never changes underneath a link that has already been shared, and an
// index of twenty posts does not read as twenty copies of one card.
export const COVERS = [
  { bg: '#F3F0FB', ink: '#1B0D44', accent: '#7C5CE6', chip: '#C6F15C', chipInk: '#1B0D44' },
  { bg: '#1B0D44', ink: '#FFFFFF', accent: '#C6F15C', chip: '#7C5CE6', chipInk: '#FFFFFF' },
  { bg: '#EDE7FF', ink: '#1B0D44', accent: '#B0A0FF', chip: '#F0A2FD', chipInk: '#1B0D44' },
  { bg: '#FBFAF9', ink: '#1B0D44', accent: '#F0A2FD', chip: '#C6F15C', chipInk: '#1B0D44' },
  { bg: '#C6F15C', ink: '#1B0D44', accent: '#7C5CE6', chip: '#1B0D44', chipInk: '#C6F15C' },
  { bg: '#7C5CE6', ink: '#FFFFFF', accent: '#C6F15C', chip: '#FBFAF9', chipInk: '#1B0D44' },
]

export function coverLook(variant: number) {
  const n = Math.abs(Math.floor(variant || 0)) % COVERS.length
  return COVERS[n]
}
