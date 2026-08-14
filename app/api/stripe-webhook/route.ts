import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_API_VERSION } from '../../../lib/stripe'
import { sendMail, subscriptionCancelledEmail, subscriptionEndedEmail, paymentFailedEmail, upgradedEmail } from '../../../lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co'
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const ACTIVE = ['active', 'trialing']

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !whSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION as any })
  const sig = req.headers.get('stripe-signature') as string
  const raw = await req.text()

  let event: any
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret)
  } catch (err: any) {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 })
  }

  const sb = admin()

  async function syncFromSubscription(sub: any) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    let uid = (sub.metadata && sub.metadata.supabase_uid) || null

    if (!uid) {
      const { data } = await sb
        .from('subscriptions')
        .select('owner_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      uid = data ? data.owner_id : null
    }
    if (!uid) return

    const { data: priorSub } = await sb
      .from('subscriptions')
      .select('cancel_at_period_end')
      .eq('owner_id', uid)
      .maybeSingle()
    const cancelWasFlagged = priorSub ? !!priorSub.cancel_at_period_end : false

    const item = sub.items && sub.items.data ? sub.items.data[0] : null
    const interval = item && item.price && item.price.recurring ? item.price.recurring.interval : null
    const rawEnd = sub.current_period_end || (item ? item.current_period_end : null)
    const periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null

    await sb.from('subscriptions').upsert(
      {
        owner_id: uid,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: sub.status,
        price_interval: interval === 'month' ? 'month' : 'year',
        current_period_end: periodEnd,
        cancel_at_period_end: !!sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id' }
    )

    const isPro = ACTIVE.indexOf(sub.status) >= 0

    // what did we think their plan was before this event?
    const { data: before } = await sb.from('profiles').select('plan').eq('id', uid).maybeSingle()
    const wasPro = before ? before.plan === 'pro' : false

    await sb
      .from('profiles')
      .update({ plan: isPro ? 'pro' : 'free', plan_until: isPro ? periodEnd : null })
      .eq('id', uid)

    // --- transactional mail, best effort ---
    try {
      const { data: who } = await sb.auth.admin.getUserById(uid)
      const addr = who && who.user ? who.user.email || '' : ''
      if (addr) {
        // Somebody has just paid and nothing told them it worked. The order
        // matters: a cancellation flagged on the same event must win, or a
        // person cancelling in their first hour gets congratulated for it.
        if (isPro && !wasPro && !sub.cancel_at_period_end) {
          const renews = periodEnd
            ? new Date(periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : null
          await sendMail(addr, 'You are on Relay Pro', upgradedEmail(interval === 'month' ? 'month' : 'year', renews))
        } else if (isPro && sub.cancel_at_period_end && !cancelWasFlagged) {
          const ends = periodEnd
            ? new Date(periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : null
          await sendMail(addr, 'Your Relay Pro subscription is cancelled', subscriptionCancelledEmail(ends))
        } else if (wasPro && !isPro) {
          await sendMail(addr, 'Your Relay Pro features have ended', subscriptionEndedEmail())
        }
      }
    } catch (e) {}

    if (!isPro) {
      const { data: page } = await sb
        .from('pages')
        .select('id, theme_id')
        .eq('owner_id', uid)
        .maybeSingle()
      if (page) {
        const { data: theme } = await sb
          .from('themes')
          .select('tier')
          .eq('id', page.theme_id)
          .maybeSingle()
        if (theme && theme.tier === 'pro') {
          await sb.from('pages').update({ theme_id: 'sherbet', use_custom: false, bg_image_url: null, font_family: 'manrope' }).eq('id', page.id)
        }
        // the badge is a paid removal, so it comes back when Pro ends
        await sb.from('pages').update({ show_branding: true }).eq('id', page.id)
      }
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.subscription) {
        const subId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        const sub: any = await stripe.subscriptions.retrieve(subId)
        if (session.client_reference_id && !(sub.metadata && sub.metadata.supabase_uid)) {
          await stripe.subscriptions.update(subId, { metadata: { supabase_uid: session.client_reference_id } })
          sub.metadata = sub.metadata || {}
          sub.metadata.supabase_uid = session.client_reference_id
        }
        await syncFromSubscription(sub)
      }
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncFromSubscription(event.data.object)
    } else if (event.type === 'invoice.payment_failed') {
      // Stripe retries a failed card for a couple of weeks before it gives up
      // and the subscription ends. Nothing changes on the account here — the
      // page keeps its Pro styling throughout — but the person deserves to
      // hear it from us while there is still time to fix the card.
      const invoice: any = event.data.object
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (customerId) {
        const { data: row } = await sb
          .from('subscriptions')
          .select('owner_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (row && row.owner_id) {
          try {
            const { data: who } = await sb.auth.admin.getUserById(row.owner_id)
            const addr = who && who.user ? who.user.email || '' : ''
            if (addr) {
              await sendMail(
                addr,
                'Your Relay payment did not go through',
                paymentFailedEmail(!!invoice.next_payment_attempt)
              )
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
