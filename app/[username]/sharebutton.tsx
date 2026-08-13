'use client'

import { useState } from 'react'

export function ShareButton({ username, name, color }: { username: string; name: string; color: string }) {
  const [copied, setCopied] = useState(false)
  const url = 'https://relayme.bio/' + username

  async function share() {
    // On a phone this opens the real share sheet, which is what people expect.
    // Everywhere else, copying the link is the useful thing.
    const nav: any = typeof navigator !== 'undefined' ? navigator : null
    if (nav && nav.share) {
      try {
        await nav.share({ title: name || username, text: 'Find ' + (name || username) + ' here', url })
        return
      } catch (e) {
        // cancelled, or share refused — fall through to copying
      }
    }
    try {
      await nav.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1900)
    } catch (e) {}
  }

  return (
    <button className="pubshare" onClick={share} aria-label={'Share ' + (name || username)} title="Share this page"
      style={{ color, borderColor: 'currentColor' }}>
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path d="M12 15.5V3.5M12 3.5 7.6 8M12 3.5 16.4 8" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 14v4.6A1.9 1.9 0 0 0 6.4 20.5h11.2a1.9 1.9 0 0 0 1.9-1.9V14" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          </svg>
          <span>Share</span>
        </>
      )}
    </button>
  )
}
