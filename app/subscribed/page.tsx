import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Blob } from '../blob'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Confirmed',
  robots: { index: false, follow: false },
}

// Where a confirmation link lands. Also where an unsubscribe link lands, with
// &leave=1, so a person can get off a list without an account or a login.
export default async function Subscribed({
  searchParams,
}: {
  searchParams: { t?: string; leave?: string }
}) {
  const token = (searchParams.t || '').slice(0, 40)
  const leaving = searchParams.leave === '1'
  let state: 'ok' | 'left' | 'bad' = 'bad'
  let pageName = ''

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (token && key) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co',
      key,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: row } = await admin
      .from('subscribers')
      .select('id, page_id, confirmed_at')
      .eq('token', token)
      .maybeSingle()

    if (row) {
      const { data: page } = await admin
        .from('pages').select('username, display_name').eq('id', row.page_id).maybeSingle()
      pageName = page ? (page.display_name || page.username) : ''

      if (leaving) {
        await admin.from('subscribers').delete().eq('id', row.id)
        state = 'left'
      } else {
        if (!row.confirmed_at) {
          await admin.from('subscribers').update({ confirmed_at: new Date().toISOString() }).eq('id', row.id)
        }
        state = 'ok'
      }
    }
  }

  return (
    <main className="centre">
      <Blob size={140} mood={state === 'bad' ? 'sad' : 'happy'} />
      {state === 'ok' && (
        <>
          <h1 style={{ fontSize: 28, margin: '10px 0 6px' }}>You&rsquo;re on the list</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 380, lineHeight: 1.6 }}>
            {pageName ? pageName + ' can now email you.' : 'That address is confirmed.'} Relay itself
            will never email you, and every message they send has a way out at the bottom.
          </p>
        </>
      )}
      {state === 'left' && (
        <>
          <h1 style={{ fontSize: 28, margin: '10px 0 6px' }}>You&rsquo;re off the list</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 380, lineHeight: 1.6 }}>
            We have deleted your address{pageName ? ' from ' + pageName + '&rsquo;s list' : ''}. Nothing was kept.
          </p>
        </>
      )}
      {state === 'bad' && (
        <>
          <h1 style={{ fontSize: 28, margin: '10px 0 6px' }}>That link has expired</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 380, lineHeight: 1.6 }}>
            It may already have been used, or the address may have been removed. Nothing is stored
            for you either way.
          </p>
        </>
      )}
      <a href="/" className="btn" style={{ marginTop: 18 }}>Back to Relay →</a>
    </main>
  )
}
