'use client'

import { useEffect, useState } from 'react'

export function ClosedNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.search.indexOf('closed=1') < 0) return
    setShow(true)
    window.history.replaceState({}, '', '/')
    // a closed account should not be greeted by a sign-up popup
    try { window.localStorage.setItem('relay.invite.seen', '1') } catch (e) {}
  }, [])

  if (!show) return null

  return (
    <div className="banner" style={{ marginBottom: 28 }}>
      Your account is closed and your page has been taken down. We have emailed you a confirmation.
      Thanks for giving RelayMe a go.
    </div>
  )
}
