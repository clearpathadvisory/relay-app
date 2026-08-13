import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { sendMail, confirmSubscriptionEmail } from '../../../lib/email'
import { tooMany } from '../../../lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sign-ups never touch the database from a browser. This route rate limits by
// address, checks the page actually has capture switched on, and stores the
// entry unconfirmed until the person holding that inbox clicks the link —
// because anyone can type a stranger's address into a form.
function ipHash(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = (fwd.split(',')[0] || req.headers.get('x-real-ip') || '').trim()
  const salt = process.env.TRACK_SALT || 'relay-visitor-salt'
  return createHash('sha256').update(salt + '|' + ip).digest('hex').slice(0, 32)
}

// Deliberately plain. Anything cleverer rejects addresses that work.
function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
}

export async function POST(req: NextRequest) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return NextResponse.json({ error: 'Not available right now.' }, { status: 503 })

  let pageId = ''
  let email = ''
  try {
    const body = await req.json()
    pageId = String(body.pageId || '').slice(0, 40)
    email = String(body.email || '').trim().toLowerCase().slice(0, 254)
  } catch (e) {}

  if (!pageId || !looksLikeEmail(email)) {
    return NextResponse.json({ error: 'That does not look like an email address.' }, { status: 400 })
  }
  if (tooMany('subscribe', ipHash(req), 5, 600000)) {
    return NextResponse.json({ error: 'Too many sign-ups from here. Try again later.' }, { status: 429 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co',
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: page } = await admin
    .from('pages')
    .select('id, username, display_name, capture_on, is_published')
    .eq('id', pageId)
    .maybeSingle()

  if (!page || !page.capture_on || !page.is_published) {
    return NextResponse.json({ error: 'This page is not collecting emails.' }, { status: 400 })
  }

  const { data: existing } = await admin
    .from('subscribers')
    .select('id, token, confirmed_at')
    .eq('page_id', page.id)
    .eq('email', email)
    .maybeSingle()

  let token = existing ? existing.token : null

  if (!existing) {
    const { data: made, error } = await admin
      .from('subscribers')
      .insert({ page_id: page.id, email })
      .select('token')
      .maybeSingle()
    if (error || !made) return NextResponse.json({ error: 'Could not save that.' }, { status: 500 })
    token = made.token
  } else if (existing.confirmed_at) {
    // already on the list; say the same thing either way rather than telling a
    // stranger whether an address is subscribed to someone's page
    return NextResponse.json({ ok: true })
  }

  const name = page.display_name || page.username
  const base = 'https://relayme.bio'
  await sendMail(
    email,
    'Confirm your email for ' + name,
    confirmSubscriptionEmail(name, base + '/' + page.username, base + '/subscribed?t=' + token)
  )

  return NextResponse.json({ ok: true })
}
