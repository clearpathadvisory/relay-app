import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'
import { SITE_URL, STRIPE_API_VERSION } from '../../../lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co'

  if (!secret || !serviceKey) {
    return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 500 })
  }

  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userRes, error } = await admin.auth.getUser(token)
  if (error || !userRes.user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  if (tooMany('portal', userRes.user.id, 8, 60000)) {
    return NextResponse.json({ error: 'Too many attempts. Wait a minute and try again.' }, { status: 429 })
  }

  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('owner_id', userRes.user.id)
    .maybeSingle()

  if (!sub || !sub.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account yet.' }, { status: 400 })
  }

  try {
    const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION as any })
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: SITE_URL + '/dashboard',
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e && e.message ? e.message : 'Portal failed.' }, { status: 500 })
  }
}
