'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Blob } from './blob'

// A thrown error would otherwise render Next's unstyled default. This keeps a
// bad moment inside the product, and offers the one thing that usually fixes it.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <main className="centre">
      <Blob size={140} mood="sad" />
      <h1 style={{ fontSize: 28, margin: '10px 0 6px' }}>That did not load</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 360, lineHeight: 1.6 }}>
        Something went wrong at our end. Nothing you had saved is affected.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn" onClick={reset}>Try again</button>
        <a className="btn ghost" href="/">Back to Relay</a>
      </div>
      {error.digest && (
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>Reference {error.digest}</p>
      )}
    </main>
  )
}
