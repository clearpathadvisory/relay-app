'use client'

import { useEffect, useState } from 'react'
import { Blob, Star } from './blob'

const SEEN = 'relay.invite.seen'
const DWELL_MS = 28000

export function SignupModal() {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let seen = false
    try { seen = window.localStorage.getItem(SEEN) === '1' } catch (e) {}
    if (seen) { setDone(true); return }

    let fired = false
    const show = () => {
      if (fired) return
      fired = true
      setOpen(true)
      try { window.localStorage.setItem(SEEN, '1') } catch (e) {}
    }

    // 1. they have hung around a while
    const timer = setTimeout(show, DWELL_MS)

    // 2. desktop: the cursor leaves through the top of the window
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show() }

    // 3. touch: no mouseleave exists, so use reading depth instead
    const onScroll = () => {
      const h = document.documentElement
      const depth = (h.scrollTop + window.innerHeight) / h.scrollHeight
      if (depth > 0.72) show()
    }

    document.addEventListener('mouseout', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseout', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (done || !open) return null

  return (
    <div className="modalwrap" onClick={() => setOpen(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="invite-h" onClick={(e) => e.stopPropagation()}>
        <button className="modalx" onClick={() => setOpen(false)} aria-label="Close">✕</button>

        <Star color="#C6F15C" size={22} style={{ position: 'absolute', top: 22, left: 26 }} />
        <Star color="#F0A2FD" size={15} style={{ position: 'absolute', bottom: 96, right: 34 }} />

        <div className="modalblob"><Blob size={112} /></div>

        <h2 id="invite-h" className="modalh">One link.<br />Everything you make.</h2>
        <p className="modalp">
          Unlimited links, your own photo, and a proper preview of every site you point to.
          Free, and the name is yours the second you claim it.
        </p>

        <a href="/login" className="btn modalcta">Grab your name →</a>
        <p className="modalfine">Takes about 40 seconds. No card, no password.</p>
      </div>
    </div>
  )
}
