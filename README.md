# Relay

A link-in-bio service at [relayme.bio](https://relayme.bio), by ClearPath Advisory.

React 19 / Next.js 14 App Router, Supabase (Postgres, auth, storage), Stripe, deployed on Vercel.

## Running it

```
npm install
npm run dev
```

## Environment variables

Set these in Vercel, not in the repo.

| Name | Used for |
| --- | --- |
| `STRIPE_SECRET_KEY` | Checkout, billing portal, cancellations |
| `STRIPE_WEBHOOK_SECRET` | Verifying webhook signatures |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin work: webhooks, account deletion |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `RESEND_API_KEY` | Transactional email. Without it, emails silently no-op |
| `RESEND_FROM` | Optional sender, defaults to `Relay <hello@relayme.bio>` |

The Supabase publishable key in `lib/supabase.ts` is meant to be public; row-level
security does the real work.

## Layout

```
app/
  globals.css              design system, responsive rules, animations
  layout.tsx               fonts and metadata
  blob.tsx                 mascot and decorative SVGs
  socialicons.tsx          social platform catalogue and glyphs
  signupmodal.tsx          exit-intent / dwell sign-up prompt
  closednotice.tsx         post-deletion confirmation banner
  page.tsx                 landing page
  login/, auth/callback/   passwordless sign-in
  dashboard/page.tsx       editor: content, design, brand, stats, account, share
  dashboard/phone.tsx      live phone preview
  [username]/              public page, server rendered
  api/                     linkmeta, checkout, portal, stripe-webhook, delete-account
lib/
  supabase.ts              clients, types, fonts, resolveLook()
  stripe.ts                price IDs and API version
  email.ts                 Resend helper and message templates
```

## Two things worth knowing

`resolveLook(page, theme)` is the single source of truth for appearance. The phone
preview and the public page both use it, so they cannot drift apart.

The dashboard rail is pinned left; only `.work` centres. Putting
`justify-content: center` on `.shell` centres the rail too and pushes it off the edge.
