import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The blog index and every post are cached for five minutes, so a publish sat
// invisible while the editor said "Saved". This pushes it through. The caller
// must be a blog admin, checked server-side against the same table the row
// level policies use — the client claiming to be one is not enough.
export async function POST(req: NextRequest) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!key || !token) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co',
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: userRes, error } = await admin.auth.getUser(token)
  if (error || !userRes.user) return NextResponse.json({ ok: false }, { status: 401 })
  if (tooMany('blogrevalidate', userRes.user.id, 40, 60000)) {
    return NextResponse.json({ error: 'Too many refreshes.' }, { status: 429 })
  }

  const { data: isAdmin } = await admin
    .from('blog_admins')
    .select('user_id')
    .eq('user_id', userRes.user.id)
    .maybeSingle()
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 404 })

  let slug = ''
  try { slug = String(((await req.json()) || {}).slug || '') } catch (e) { slug = '' }

  revalidatePath('/blog')
  revalidatePath('/sitemap.xml')
  if (/^[a-z0-9-]{3,80}$/.test(slug)) {
    revalidatePath('/blog/' + slug)
    // The cover is a separate cached thing; a retitled post kept the old card.
    revalidatePath('/blog/' + slug + '/cover')
  }

  return NextResponse.json({ ok: true })
}
