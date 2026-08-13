import { Blob } from './blob'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

// Without this, anything Next cannot route falls through to its own bare
// 404, which looks like a broken deployment rather than a wrong address.
export default function NotFound() {
  return (
    <main className="centre">
      <Blob size={140} mood="sad" />
      <h1 style={{ fontSize: 28, margin: '10px 0 6px' }}>Nothing at this address</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 340, lineHeight: 1.6 }}>
        The link may be mistyped, or the page may have been taken down.
      </p>
      <a href="/" className="btn" style={{ marginTop: 18 }}>Back to Relay →</a>
    </main>
  )
}
