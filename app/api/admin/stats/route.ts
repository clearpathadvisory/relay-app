import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../../lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Aggregates over auth.users and every other user's rows, which RLS quite
// rightly hides from the browser. So the numbers are assembled server-side with
// the service key, and the caller is checked against the same blog_admins table
// the editor uses. The client is told nothing until that check passes.
export async function GET(req: NextRequest) {
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
  if (tooMany('adminstats', userRes.user.id, 60, 60000)) {
    return NextResponse.json({ error: 'Slow down.' }, { status: 429 })
  }

  const { data: isAdmin } = await admin
    .from('blog_admins')
    .select('user_id')
    .eq('user_id', userRes.user.id)
    .maybeSingle()
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 404 })

  const { data, error: rpcErr } = await admin.schema('private').rpc('admin_stats')
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, stats: data })
}
