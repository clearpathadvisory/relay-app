import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Country breakdown for one page, for the Pro panel in the dashboard.
//
// Three separate gates, deliberately not collapsed into one:
//   1. a valid bearer token, or nothing happens
//   2. a rate limit, so this cannot be used to hammer the aggregate
//   3. ownership and Pro, re-checked inside the database function itself
//
// The third is the one that matters. This route could be wrong, or could be
// replaced by a future route that forgets a check; private.page_country_stats
// refuses regardless, because it looks up the owner and the plan itself. The
// service key never leaves this process, and the private schema is not exposed
// through PostgREST, so a browser cannot call the function directly.
export async function GET(req: NextRequest) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!key || !token) return NextResponse.json({ ok: false }, { status: 401 })

  const pageId = (req.nextUrl.searchParams.get('pageId') || '').slice(0, 40)
  const days = Number(req.nextUrl.searchParams.get('days') || 30)
  if (!pageId) return NextResponse.json({ ok: false }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co',
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: userRes, error } = await admin.auth.getUser(token)
  if (error || !userRes.user) return NextResponse.json({ ok: false }, { status: 401 })

  if (tooMany('countries', userRes.user.id, 30, 60000)) {
    return NextResponse.json({ error: 'Slow down.' }, { status: 429 })
  }

  const { data, error: rpcErr } = await admin.schema('private').rpc('page_country_stats', {
    p_user_id: userRes.user.id,
    p_page_id: pageId,
    p_days: Number.isFinite(days) ? days : 30,
  })

  if (rpcErr) return NextResponse.json({ ok: false }, { status: 500 })

  // A page belonging to someone else and a page that does not exist return the
  // same 404, so this cannot be used to test whether a page id is real.
  const res: any = data
  if (!res || res.ok !== true) {
    if (res && res.reason === 'not_pro') {
      return NextResponse.json({ ok: false, reason: 'not_pro' }, { status: 403 })
    }
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  return NextResponse.json(res)
}
