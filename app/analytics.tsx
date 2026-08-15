'use client'

import { usePathname } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'

/**
 * Analytics on our own marketing pages, and nowhere else.
 *
 * The FAQ tells every creator that their public page carries no third-party
 * analytics, and the privacy policy repeats it. The root layout wraps public
 * profile pages too, so dropping <Analytics /> straight into it would quietly
 * break that promise on every page our users publish.
 *
 * Hence an allowlist rather than a blocklist. A new marketing page has to be
 * added here on purpose; the failure mode of forgetting is "we do not measure
 * that page", which is the harmless direction. A blocklist would fail the
 * other way — a new username pattern would start being tracked silently.
 *
 * Vercel Web Analytics sets no cookies and collects no personal data, so this
 * needs no consent banner. It is served from our own domain, so it also needs
 * no change to the Content-Security-Policy.
 */

const MARKETING = ['/', '/blog', '/privacy', '/terms', '/vs-linktree']

export function MarketingAnalytics() {
  const path = usePathname() || '/'

  const allowed =
    MARKETING.includes(path) ||
    path.startsWith('/blog/') // individual posts are marketing too

  if (!allowed) return null
  return <Analytics />
}
