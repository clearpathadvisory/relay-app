'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Blob } from '../blob'

export default function Login() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function send() {
    if (!email.includes('@')) {
      setState('error')
      setMsg("That doesn't look like an email.")
      return
    }
    setState('sending')
    const redirect =
      typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } })
    if (error) { setState('error'); setMsg(error.message) } else { setState('sent') }
  }

  return (
    <main className="centre">
      <div style={{ width: '100%', maxWidth: 390 }}>
        <Blob size={130} mood={state === 'error' ? 'sad' : 'happy'} />
        {state === 'sent' ? (
          <>
            <h1 style={{ fontSize: 30, margin: '12px 0 8px', fontWeight: 800 }}>Check your email</h1>
            <p style={{ color: 'rgba(27,13,68,.7)', fontSize: 15, lineHeight: 1.6 }}>
              We relayed a sign-in link to {email}. Open it in this same browser.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 30, margin: '12px 0 8px', fontWeight: 800 }}>Sign in to Relay</h1>
            <p style={{ color: 'rgba(27,13,68,.7)', fontSize: 15, margin: '0 0 22px' }}>No password. We email you a link.</p>
            <input className="field" placeholder="name@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
            <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={send} disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Email me a link'}
            </button>
            {state === 'error' && <p className="err">{msg}</p>}
          </>
        )}
        <p style={{ marginTop: 22, fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>
          By signing in you agree to our{' '}
          <a href="/terms" style={{ color: 'var(--violet)', fontWeight: 600 }}>Terms</a> and{' '}
          <a href="/privacy" style={{ color: 'var(--violet)', fontWeight: 600 }}>Privacy Policy</a>.
        </p>
        <p style={{ marginTop: 18, fontSize: 14 }}>
          <a href="/" style={{ color: 'var(--muted)' }}>← back home</a>
        </p>
      </div>
    </main>
  )
}
