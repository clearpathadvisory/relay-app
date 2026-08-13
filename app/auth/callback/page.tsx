'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Blob } from '../../blob'

export default function Callback() {
  const [msg, setMsg] = useState('Signing you in…')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    ;(async () => {
      const hash = window.location.hash || ''
      const search = window.location.search || ''
      const hp = new URLSearchParams(hash.replace(/^#/, ''))
      const sp = new URLSearchParams(search)

      const errDesc = hp.get('error_description') || sp.get('error_description')
      if (errDesc) { setFailed(true); setMsg(decodeURIComponent(errDesc.replace(/\+/g, ' '))); return }

      const code = sp.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setFailed(true); setMsg(error.message); return }
      }

      const at = hp.get('access_token')
      const rt = hp.get('refresh_token')
      if (at && rt) {
        const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })
        if (error) { setFailed(true); setMsg(error.message); return }
      }

      for (let i = 0; i < 24; i++) {
        const { data } = await supabase.auth.getSession()
        if (data.session) { window.location.replace('/dashboard'); return }
        await new Promise((r) => setTimeout(r, 250))
      }

      setFailed(true)
      setMsg('That link did not work. It may have already been used.')
    })()
  }, [])

  return (
    <main className="centre">
      <Blob size={130} mood={failed ? 'sad' : 'happy'} />
      <h1 style={{ fontSize: 26, margin: '12px 0 8px', fontWeight: 800 }}>
        {failed ? 'Could not sign you in' : 'One moment'}
      </h1>
      <p style={{ color: 'rgba(27,13,68,.7)', fontSize: 15, maxWidth: 360, lineHeight: 1.6 }}>{msg}</p>
      {failed && <a href="/login" className="btn" style={{ marginTop: 18 }}>Send a new link</a>}
    </main>
  )
}
