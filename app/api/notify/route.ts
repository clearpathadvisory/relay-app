import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'
import { sendMail, welcomeEmail, pageOfflineEmail } from '../../../lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The moments worth an email that happen in the browser rather than in a
// webhook: claiming a name, and taking a page offline. The browser says which
// happened; it does not say who to, and it cannot choose the wording — both are
// read from the account behind the token.
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

  const user = userRes.user
  if (tooMany('notify', user.id, 6, 60000)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  let kind = ''
  try {
    const body = await req.json()
    kind = String(body.kind || '')
  } catch (e) {}

  const { data: page } = await admin
    .from('pages')
    .select('username, is_published')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!page || !page.username || !user.email) return NextResponse.json({ ok: true })

  if (kind === 'welcome') {
    await sendMail(user.email, 'relayme.bio/' + page.username + ' is yours', welcomeEmail(page.username))
  } else if (kind === 'offline' && !page.is_published) {
    // only sent when the page really is offline, so the message cannot contradict the account
    await sendMail(user.email, 'Your Relay page is offline', pageOfflineEmail(page.username))
  }

  return NextResponse.json({ ok: true })
}
