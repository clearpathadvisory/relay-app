'use client'

import { useState } from 'react'

// The one thing on a Relay page that asks a visitor for something. It says who
// gets the address, and it says a confirmation is coming — because an address
// entered and never confirmed is not consent, and a person who does not know a
// confirmation is due will assume it failed.
export function Capture({
  pageId, heading, button, note, look,
}: {
  pageId: string
  heading: string | null
  button: string | null
  note: string | null
  look: any
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function submit() {
    if (state === 'busy') return
    const v = email.trim()
    if (!v) { setState('error'); setMsg('An email address goes here.'); return }
    setState('busy'); setMsg('')
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, email: v }),
      })
      const j = await r.json()
      if (r.ok && j.ok) { setState('done'); setEmail('') }
      else { setState('error'); setMsg(j.error || 'That did not go through.') }
    } catch (e) {
      setState('error'); setMsg('That did not go through.')
    }
  }

  if (state === 'done') {
    return (
      <div className="capture" style={{ background: look.buttonBg, color: look.buttonText, borderRadius: look.buttonRadius, border: look.buttonBorder }}>
        <p className="capheading">Check your inbox</p>
        <p className="capnote">
          We have sent you a message with a link in it. Click that and you are on the list —
          until then, nothing is shared.
        </p>
      </div>
    )
  }

  return (
    <div className="capture" style={{ background: look.buttonBg, color: look.buttonText, borderRadius: look.buttonRadius, border: look.buttonBorder }}>
      <p className="capheading">{heading || 'Get my emails'}</p>

      <div className="caprow">
        <input
          className="capinput"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          aria-label="Your email address"
          style={{ color: look.buttonText, borderColor: 'currentColor' }}
        />
        <button
          className="capbtn"
          onClick={submit}
          disabled={state === 'busy'}
          style={{ background: look.accentBg, color: look.accentText, borderRadius: look.buttonRadius }}
        >
          {state === 'busy' ? 'Sending…' : (button || 'Sign me up')}
        </button>
      </div>

      {state === 'error' && <p className="caperr">{msg}</p>}

      <p className="capnote">
        {note ? note + ' ' : ''}
        We will email you once to check it is really you. Your address goes to the owner of this
        page, not to Relay, and you can leave from any message they send.
      </p>
    </div>
  )
}
