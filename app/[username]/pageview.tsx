'use client'

import { useEffect } from 'react'

// A page view is worth more than a tap count on its own: without it there is no
// click-through rate, which is the number that tells someone whether their page
// is working. Counted once per visitor per hour, server side.
export function PageView({ pageId }: { pageId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ kind: 'view', pageId, referrer: document.referrer || '' })
    try {
      const nav: any = navigator
      if (nav && nav.sendBeacon) {
        nav.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
        return
      }
    } catch (e) {}
    try {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    } catch (e) {}
  }, [pageId])

  return null
}
