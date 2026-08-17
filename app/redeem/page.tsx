'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Where a giveaway winner turns a code into a year of Pro.
 *
 * A separate page rather than a field in the dashboard, because the people
 * arriving here are following a link from a comment reply and may not have an
 * account yet. The page has to handle "signed out, holding a code" as its
 * normal case, not as an error.
 *
 * The code in the URL (/redeem?code=RELAY-XXXX-XXXX) survives the sign-in
 * round trip through sessionStorage, so a winner never has to find the comment
 * again after checking their email.
 */
const STASH = 'relayme.redeem.code'

export default function Redeem() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState<{ until: string } | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const fromUrl = (url.searchParams.get('code') || '').toUpperCase()
    const stashed = sessionStorage.getItem(STASH) || ''
    if (fromUrl) { setCode(fromUrl); sessionStorage.setItem(STASH, fromUrl) }
    else if (stashed) setCode(stashed)

    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
  }, [])

  async function sendLink() {
    const addr = email.trim()
    if (!addr) { setMsg('Enter the email you want on the account.'); return }
    setBusy(true); setMsg('')
    sessionStorage.setItem(STASH, code.toUpperCase())
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.origin + '/redeem' },
    })
    setBusy(false)
    setMsg(error ? error.message : 'Check your email — the link brings you back here.')
  }

  async function claim() {
    const c = code.trim().toUpperCase()
    if (!c) { setMsg('Enter your code.'); return }
    setBusy(true); setMsg('')
    const { data, error } = await supabase.rpc('redeem_comp_code', { p_code: c })
    setBusy(false)
    if (error) { setMsg('Something went wrong. Try again in a moment.'); return }
    const r: any = data
    if (r?.ok) {
      sessionStorage.removeItem(STASH)
      setDone({ until: r.plan_until })
      return
    }
    // Each case gets its own sentence. "Invalid code" tells someone nothing
    // about whether to retype it or give up.
    setMsg(
      r?.error === 'unknown_code'  ? 'That code is not one of ours. Check for a mistyped character.' :
      r?.error === 'already_used'  ? 'That code has already been claimed on another account.' :
      r?.error === 'expired_code'  ? 'That code has passed its claim date.' :
      r?.error === 'not_signed_in' ? 'Sign in first and the code will still be here.' :
      'Something went wrong. Try again in a moment.'
    )
  }

  const until = done && new Date(done.until).toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="legal" style={{ maxWidth: 560 }}>
      {done ? (
        <>
          <h1>You are on Pro.</h1>
          <p>
            Every Pro feature is unlocked on your page now, and stays that way
            until <strong>{until}</strong>. No card, nothing to cancel — it
            simply returns to the free plan on that date and your page keeps
            working.
          </p>
          <p style={{ marginTop: 26 }}>
            <a className="btn" href="/dashboard">Open your dashboard</a>
          </p>
        </>
      ) : (
        <>
          <h1>Claim your year of Pro</h1>
          <p>
            Enter the code from your giveaway message. One code, one account,
            twelve months.
          </p>

          <label className="ahint" htmlFor="code" style={{ display: 'block', marginTop: 24 }}>Your code</label>
          <input
            id="code" className="field" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="RELAY-XXXX-XXXX" autoCapitalize="characters" spellCheck={false}
            style={{ marginTop: 6, fontWeight: 700, letterSpacing: '0.04em' }}
          />

          {signedIn === false && (
            <>
              <label className="ahint" htmlFor="email" style={{ display: 'block', marginTop: 20 }}>
                Your email — we send a sign-in link, there is no password
              </label>
              <input
                id="email" className="field" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com" autoComplete="email"
                style={{ marginTop: 6 }}
              />
              <p style={{ marginTop: 18 }}>
                <button className="btn" onClick={sendLink} disabled={busy}>
                  {busy ? 'Sending…' : 'Send me a sign-in link'}
                </button>
              </p>
            </>
          )}

          {signedIn === true && (
            <p style={{ marginTop: 20 }}>
              <button className="btn" onClick={claim} disabled={busy}>
                {busy ? 'Claiming…' : 'Claim my year'}
              </button>
            </p>
          )}

          {msg && <p className="ahint" style={{ marginTop: 14 }}>{msg}</p>}

          <p className="ahint" style={{ marginTop: 30 }}>
            Trouble with a code? Email hello@relayme.bio and include it.
          </p>
        </>
      )}
        </div>
      </div>
    </main>
  )
}
