'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// The last resort: an error thrown in the root layout itself, where the normal
// error boundary has nothing left to render inside. Without this, the whole
// failure is invisible.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FBFAF9', color: '#1B0D44' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 26, margin: '0 0 8px', fontWeight: 800 }}>Relay could not load</h1>
          <p style={{ maxWidth: 360, lineHeight: 1.6, color: '#6B5FA8' }}>
            Something went wrong at our end. Nothing you had saved is affected.
          </p>
          <a href="/" style={{ marginTop: 18, background: '#1B0D44', color: '#fff', padding: '13px 22px', borderRadius: 12, fontWeight: 600, textDecoration: 'none' }}>
            Back to Relay
          </a>
        </main>
      </body>
    </html>
  )
}
