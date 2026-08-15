'use client'

import { useEffect, useState } from 'react'
import { toCsv, downloadCsv, stamp } from '../../../lib/csv'
import { supabase } from '../../../lib/supabase'

// Sits beside /admin/blog and behind the same allowlist. Nobody else's
// dashboard changes, and none of this code loads on their side of the app.

type Stats = any

function n(v: any) {
  return typeof v === 'number' ? v.toLocaleString('en-GB') : '0'
}

function pct(a: number, b: number) {
  if (!b) return '0%'
  return Math.round((a / b) * 100) + '%'
}

function when(iso: string | null) {
  if (!iso) return 'never'
  const d = new Date(iso)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return mins + 'm ago'
  if (mins < 1440) return Math.floor(mins / 60) + 'h ago'
  const days = Math.floor(mins / 1440)
  if (days < 30) return days + 'd ago'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="scard">
      <p className="slab">{label}</p>
      <p className="sval">{value}</p>
      {note ? <p className="snote">{note}</p> : null}
    </div>
  )
}

export default function AdminStats() {
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [s, setS] = useState<Stats>(null)
  const [err, setErr] = useState('')

  async function load() {
    const { data } = await supabase.auth.getSession()
    const token = data.session ? data.session.access_token : ''
    const res = await fetch('/api/admin/stats', { headers: { authorization: 'Bearer ' + token } })
    if (!res.ok) { setErr('Could not load the numbers (' + res.status + ').'); return }
    const body = await res.json()
    setS(body.stats)
    setErr('')
  }

  useEffect(() => {
    async function waitForSession() {
      const { data: first } = await supabase.auth.getSession()
      if (first.session) return first.session
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 200))
        const { data } = await supabase.auth.getSession()
        if (data.session) return data.session
      }
      return null
    }
    ;(async () => {
      const session = await waitForSession()
      if (!session) { setReady(true); return }
      setEmail(session.user.email || '')
      const { data: admin } = await supabase
        .from('blog_admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      if (!admin) { setReady(true); return }
      setAllowed(true)
      await load()
      setReady(true)
    })()
  }, [])

  if (!ready) return <main className="wrap" style={{ paddingTop: 60 }}><p>Loading…</p></main>

  if (!allowed) {
    return (
      <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
        <div className="wrap" style={{ paddingTop: 80 }}>
          <div className="legal">
            {email ? (
              <>
                <h1>Not this account</h1>
                <p>You are signed in as <strong>{email}</strong>, which does not have access.</p>
              </>
            ) : (
              <><h1>Sign in first</h1><p><a href="/login">Sign in</a>, then come back.</p></>
            )}
          </div>
        </div>
      </main>
    )
  }

  const u = s?.users || {}
  const p = s?.plans || {}
  const g = s?.pages || {}
  const sub = s?.subscriptions || {}
  const days: any[] = s?.signups_by_day || []
  const peak = Math.max(1, ...days.map((d) => d.n))
  const recent: any[] = s?.recent || []

  // Exports run entirely in the browser from the JSON already on screen. No
  // new endpoint, so there is no second route to secure — if you could not see
  // these numbers you could not export them either.
  function exportAccounts() {
    if (!s) return
    downloadCsv(
      'relay-accounts-' + stamp() + '.csv',
      toCsv(
        ['email', 'joined', 'last_seen', 'plan', 'plan_until', 'page', 'published', 'links', 'sub_status', 'sub_interval'],
        recent.map((r) => [
          r.email,
          r.created_at || '',
          r.last_sign_in_at || '',
          r.plan || 'free',
          r.plan_until || '',
          r.username ? '/' + r.username : '',
          r.published === true ? 'yes' : r.published === false ? 'no' : '',
          r.links ?? 0,
          r.sub_status || '',
          r.sub_interval || '',
        ])
      )
    )
  }

  function exportSummary() {
    if (!s) return
    const rows: any[][] = []
    const push = (group: string, obj: any) => {
      if (!obj) return
      for (const k of Object.keys(obj)) {
        const v = (obj as any)[k]
        if (v !== null && typeof v === 'object') continue
        rows.push([group, k, v])
      }
    }
    push('users', s.users)
    push('plans', s.plans)
    push('subscriptions', s.subscriptions)
    push('pages', s.pages)
    for (const d of days) rows.push(['signups_by_day', d.day, d.n])
    rows.push(['meta', 'generated_at', s.generated_at || ''])
    rows.push(['meta', 'exported_at', new Date().toISOString()])
    downloadCsv('relay-summary-' + stamp() + '.csv', toCsv(['group', 'metric', 'value'], rows))
  }

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          <a href="/dashboard" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</a>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/admin/blog" className="btn small ghost">Blog</a>
            <button className="btn small ghost" onClick={exportAccounts} disabled={!s}>Accounts CSV</button>
            <button className="btn small ghost" onClick={exportSummary} disabled={!s}>Summary CSV</button>
            <button className="btn small" onClick={load}>Refresh</button>
          </div>
        </nav>

        {err ? <p className="aerr">{err}</p> : null}

        <h2 className="ahead" style={{ marginTop: 0 }}>Sign-ups</h2>
        <div className="sgrid">
          <Stat label="Total accounts" value={n(u.total)} />
          <Stat label="Today" value={n(u.today)} />
          <Stat label="Last 7 days" value={n(u.last_7d)} />
          <Stat label="Last 30 days" value={n(u.last_30d)} />
          <Stat label="Signed in, last 7 days" value={n(u.active_7d)}
                note={pct(u.active_7d, u.total) + ' of accounts'} />
          <Stat label="Never came back" value={n(u.never_returned)}
                note="signed up and did not return" />
        </div>

        <h2 className="ahead">Last 30 days</h2>
        <div className="sbars">
          {days.map((d) => (
            <div key={d.day} className="sbarwrap" title={d.day + ': ' + d.n}>
              <div className="sbar" style={{ height: Math.max(2, (d.n / peak) * 100) + '%' }} />
            </div>
          ))}
        </div>
        <p className="ahint">Each bar is one day. Tallest bar is {peak}.</p>

        <h2 className="ahead">Plans</h2>
        <div className="sgrid">
          <Stat label="Free" value={n(p.free)} note={pct(p.free, u.total) + ' of accounts'} />
          <Stat label="Pro" value={n(p.pro)} note={pct(p.pro, u.total) + ' of accounts'} />
          <Stat label="Pro expiring in 30 days" value={n(p.expiring_30d)} />
        </div>

        <h2 className="ahead">Subscriptions</h2>
        <div className="sgrid">
          <Stat label="Paying" value={n(sub.active)} note="active or trialing" />
          <Stat label="Monthly" value={n(sub.monthly)} />
          <Stat label="Yearly" value={n(sub.yearly)} />
          <Stat label="MRR" value={'$' + (sub.mrr_usd ?? 0)} note="net of VAT, yearly spread over 12" />
          <Stat label="Cancelling at period end" value={n(sub.cancelling)} />
          <Stat label="Payment failing" value={n(sub.past_due)} note="past due or unpaid" />
          <Stat label="Checkout abandoned" value={n(sub.incomplete)}
                note="started paying, never finished" />
          <Stat label="Cancelled" value={n(sub.canceled)} />
        </div>

        <h2 className="ahead">Pages</h2>
        <div className="sgrid">
          <Stat label="Pages" value={n(g.total)} />
          <Stat label="Published" value={n(g.published)} />
          <Stat label="With at least one link" value={n(g.with_links)} />
          <Stat label="Accounts with no page" value={n(g.no_page)}
                note={pct(g.no_page, u.total) + ' of accounts'} />
          <Stat label="Links created" value={n(g.links_total)} />
        </div>

        <h2 className="ahead">Latest 50 accounts</h2>
        <div className="stablewrap">
          <table className="stable">
            <thead>
              <tr><th>Email</th><th>Joined</th><th>Last seen</th><th>Plan</th>
                  <th>Page</th><th>Links</th><th>Subscription</th></tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i}>
                  <td>{r.email}</td>
                  <td>{when(r.created_at)}</td>
                  <td>{when(r.last_sign_in_at)}</td>
                  <td><span className={r.plan === 'pro' ? 'astat on' : 'astat'}>{r.plan}</span></td>
                  <td>{r.username ? (r.published ? '/' + r.username : '/' + r.username + ' (draft)') : '—'}</td>
                  <td>{r.links ?? 0}</td>
                  <td>{r.sub_status ? r.sub_status + (r.sub_interval ? ' · ' + r.sub_interval : '') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="ahint" style={{ marginTop: 18 }}>
          Read straight from the database, so it is current as of the last refresh. Stripe is the
          authority on money; this is the authority on who has an account.
        </p>
      </div>
    </main>
  )
}
