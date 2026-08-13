import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The public page is cached for sixty seconds, so an edit used to sit invisible
// while the dashboard said "Saved". This lets the editor push the change
// through the moment it saves. Only the page's own owner can trigger it.
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
  if (tooMany('revalidate', userRes.user.id, 30, 60000)) {
    return NextResponse.json({ error: 'Too many refreshes.' }, { status: 429 })
  }

  const { data: page } = await admin
    .from('pages')
    .select('username')
    .eq('owner_id', userRes.user.id)
    .maybeSingle()

  if (!page || !page.username) return NextResponse.json({ ok: false }, { status: 404 })

  // The page and its share card are separate cached things. Revalidating the
  // page alone left the card showing an old avatar and an old bio — which is
  // the copy every friend sees when the link is pasted into a chat.
  revalidatePath('/' + page.username)
  revalidatePath('/' + page.username + '/opengraph-image')

  return NextResponse.json({ ok: true })
}
