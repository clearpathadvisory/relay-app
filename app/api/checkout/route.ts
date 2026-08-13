import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { tooMany } from '../../../lib/ratelimit'
import { PRICE_ANNUAL, PRICE_MONTHLY, SITE_URL, STRIPE_API_VERSION } from '../../../lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co'

  if (!secret || !serviceKey) {
    return NextResponse.json({ error: 'Billing is not configured yet.' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userRes, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userRes.user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  }
  const user = userRes.user
  if (tooMany('checkout', userRes.user.id, 8, 60000)) {
    return NextResponse.json({ error: 'Too many attempts. Wait a minute and try again.' }, { status: 429 })
  }

  let interval = 'year'
  try {
    const body = await req.json()
    if (body && body.interval === 'month') interval = 'month'
  } catch (e) {}

  const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION as any })

  try {
    const { data: existing } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('owner_id', user.id)
      .maybeSingle()

    let customerId = existing ? existing.stripe_customer_id : null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_uid: user.id },
      })
      customerId = customer.id
      await admin.from('subscriptions').upsert(
        { owner_id: user.id, stripe_customer_id: customerId, status: 'incomplete', price_interval: interval },
        { onConflict: 'owner_id' }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: interval === 'month' ? PRICE_MONTHLY : PRICE_ANNUAL, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { supabase_uid: user.id } },

      // Prices are set VAT-exclusive, so Stripe works out the rate for the
      // buyer's country and adds it. It cannot do that without knowing where
      // they are, which is what the two lines below are for — automatic_tax
      // is rejected outright unless customer_update allows the address to be
      // written back to the customer record.
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      billing_address_collection: 'required',

      // A business buyer in another EU country can enter a VAT number here and
      // have the charge reverse-charged to them, which is the main reason
      // exclusive pricing is worth having.
      tax_id_collection: { enabled: true },

      // The box was on with no codes in existence, so it could only ever fail.
      allow_promotion_codes: false,
      success_url: SITE_URL + '/dashboard?upgraded=1',
      cancel_url: SITE_URL + '/dashboard',
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e && e.message ? e.message : 'Checkout failed.' }, { status: 500 })
  }
}
