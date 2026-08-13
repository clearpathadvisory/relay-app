import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Counting used to happen in the browser against a SECURITY DEFINER function
// that anon could call with any link id lifted from the page source. It now
// happens here, where the caller cannot choose their own address, and the
// database refuses a second count for the same visitor inside a window.
//
// Only a salted one-way hash of the address is ever sent to the database, and
// the row holding it is discarded within hours.
function hashIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = (fwd.split(',')[0] || req.headers.get('x-real-ip') || '').trim()
  if (!ip) return ''
  const salt = process.env.TRACK_SALT || 'relay-visitor-salt'
  return createHash('sha256').update(salt + '|' + ip).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return new NextResponse(null, { status: 204 })

  let kind = ''
  let linkId: string | null = null
  let pageId: string | null = null
  let referrer = ''
  try {
    const body = await req.json()
    kind = String(body.kind || '')
    linkId = body.linkId ? String(body.linkId).slice(0, 40) : null
    pageId = body.pageId ? String(body.pageId).slice(0, 40) : null
    referrer = String(body.referrer || '').slice(0, 300)
  } catch (e) {}

  if (kind !== 'click' && kind !== 'view') return new NextResponse(null, { status: 204 })

  const ua = req.headers.get('user-agent') || ''
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop'
  const country = req.headers.get('x-vercel-ip-country') || null

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co',
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  try {
    await admin.rpc('record_event', {
      p_kind: kind,
      p_link_id: kind === 'click' ? linkId : null,
      p_page_id: kind === 'view' ? pageId : null,
      p_ip_hash: hashIp(req),
      p_referrer: referrer || null,
      p_device: device,
      p_country: country,
    })
  } catch (e) {}

  // Never tell the caller whether the count landed; a counter that reports its
  // own state is a counter someone can tune against.
  return new NextResponse(null, { status: 204 })
}
