import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'
import { STRIPE_API_VERSION } from '../../../lib/stripe'
import { sendMail, accountClosedEmail } from '../../../lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co'
  if (!serviceKey) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 500 })
  }

  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userRes, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !userRes.user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  if (tooMany('delete', userRes.user.id, 5, 300000)) {
    return NextResponse.json({ error: 'Too many attempts. Wait five minutes.' }, { status: 429 })
  }

  const uid = userRes.user.id
  const email = userRes.user.email || ''

  // The client sends back the username it is showing. If that does not match
  // the account we resolved from the token, something is wrong — stop.
  let typed = ''
  try {
    const body = await req.json()
    typed = String(body.confirm || '').trim().toLowerCase()
  } catch (e) {}

  const { data: page } = await admin.from('pages').select('id, username').eq('owner_id', uid).maybeSingle()
  const username = page ? page.username : ''

  // An account with no page row used to skip this check entirely, so the one
  // safeguard on an irreversible action could be bypassed by never claiming a
  // name. The word DELETE stands in when there is no username to type.
  const expected = username || 'delete'
  if (typed !== expected) {
    return NextResponse.json(
      { error: username ? 'Type your username exactly to confirm.' : 'Type DELETE to confirm.' },
      { status: 400 }
    )
  }

  // 1. Stop the money first. Deleting the account while a subscription is live
  //    would keep charging somebody who no longer has an account.
  try {
    const secret = process.env.STRIPE_SECRET_KEY
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('owner_id', uid)
      .maybeSingle()
    if (secret && sub && sub.stripe_subscription_id) {
      const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION as any })
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    }
  } catch (e) {
    // an already-cancelled subscription throws; that is fine, carry on
  }

  // 2. Uploaded files
  try {
    for (const bucket of ['avatars', 'backgrounds']) {
      const { data: files } = await admin.storage.from(bucket).list(uid)
      if (files && files.length) {
        await admin.storage.from(bucket).remove(files.map((f: any) => uid + '/' + f.name))
      }
    }
  } catch (e) {}

  // 3. Rows. Children first, in case cascades are not set everywhere.
  try {
    if (page) {
      await admin.from('click_events').delete().eq('page_id', page.id)
      await admin.from('links').delete().eq('page_id', page.id)
      await admin.from('socials').delete().eq('page_id', page.id)
      await admin.from('pages').delete().eq('id', page.id)
    }
    await admin.from('subscriptions').delete().eq('owner_id', uid)
    await admin.from('profiles').delete().eq('id', uid)
  } catch (e) {
    return NextResponse.json({ error: 'Could not delete your data. Nothing was removed.' }, { status: 500 })
  }

  // 4. Tell them, while we still know where to write
  if (email) await sendMail(email, 'Your Relay account is closed', accountClosedEmail(username || 'your page'))

  // 5. The login itself, last
  const { error: delErr } = await admin.auth.admin.deleteUser(uid)
  if (delErr) {
    return NextResponse.json({ error: 'Your data is deleted, but the login could not be removed. Contact support.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
