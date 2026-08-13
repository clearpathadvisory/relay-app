'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, Theme, Link, Page, Social, FONTS } from '../../lib/supabase'
import { SOCIALS, SocialIcon, socialHref, socialName } from '../socialicons'
import { Blob, Star, Robot, Bear, Rocket, Squiggle } from '../blob'
import { Phone } from './phone'

const FREE_FONT = 'manrope'
const PKEY = 'relay.pending'

// Emoji are 2+ UTF-16 code units, so .length counts them wrong.
// Count what the user actually sees instead.
function chars(s: string): string[] {
  try {
    const Seg = (Intl as any).Segmenter
    if (Seg) {
      const it = new Seg('en', { granularity: 'grapheme' }).segment(s)
      return Array.from(it, (x: any) => x.segment)
    }
  } catch (e) {}
  return Array.from(s)
}
function clampChars(s: string, max: number): string {
  const a = chars(s)
  return a.length <= max ? s : a.slice(0, max).join('')
}

export default function Dashboard() {
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [plan, setPlan] = useState('free')
  const [page, setPage] = useState<Page | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [claim, setClaim] = useState('')
  const [err, setErr] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [justUpgraded, setJustUpgraded] = useState(false)
  const [tab, setTab] = useState('content')
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState('')
  const [uploading, setUploading] = useState(false)
  const [bgUploading, setBgUploading] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const firstRun = useRef(true)
  const bioRef = useRef<HTMLTextAreaElement | null>(null)
  const [pending, setPending] = useState<any>({})
  const [socials, setSocials] = useState<Social[]>([])
  const [socPlat, setSocPlat] = useState('instagram')
  const [socUrl, setSocUrl] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [sub, setSub] = useState<any>(null)
  const [delOpen, setDelOpen] = useState(false)
  const [delText, setDelText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isPro = plan === 'pro'

  useEffect(() => {
    let cancelled = false
    async function waitForSession() {
      for (let i = 0; i < 12; i++) {
        const { data } = await supabase.auth.getSession()
        if (data.session) return data.session
        await new Promise((r) => setTimeout(r, 200))
      }
      return null
    }
    ;(async () => {
      const session = await waitForSession()
      if (cancelled) return
      if (typeof window !== 'undefined' && window.location.hash) window.history.replaceState({}, '', window.location.pathname)
      if (typeof window !== 'undefined' && window.location.search.indexOf('upgraded=1') >= 0) {
        setJustUpgraded(true); window.history.replaceState({}, '', '/dashboard')
      }
      const uid = session ? session.user.id : null
      setUserId(uid)
      setUserEmail(session ? session.user.email || '' : '')
      const { data: th } = await supabase.from('themes').select('*').order('sort_order')
      setThemes((th || []) as Theme[])
      if (uid) {
        const { data: pr } = await supabase.from('profiles').select('plan').eq('id', uid).maybeSingle()
        if (pr) setPlan(pr.plan)
        const { data: pg } = await supabase.from('pages').select('*').eq('owner_id', uid).maybeSingle()
        if (pg) {
          let saved: any = {}
          try { saved = JSON.parse(window.localStorage.getItem(PKEY) || '{}') || {} } catch (e) { saved = {} }
          const hasSaved = saved && Object.keys(saved).length > 0
          if (hasSaved && pr && pr.plan === 'pro') {
            // they subscribed and came back — commit what they were trying out
            await supabase.from('pages').update(saved).eq('id', pg.id)
            Object.assign(pg, saved)
            try { window.localStorage.removeItem(PKEY) } catch (e) {}
          } else if (hasSaved) {
            setPending(saved)
          }
          setPage(pg as Page); setName(pg.display_name || ''); setBio(pg.bio || ''); await loadLinks(pg.id); await loadSocials(pg.id); await loadSub(uid)
        }
      }
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (tab === 'stats' && page && !statsLoaded) loadStats(page.id)
  }, [tab, page, statsLoaded])

  // a fixed-height textarea hides the end of a long bio, so grow it to fit
  useEffect(() => {
    const el = bioRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [bio, tab, ready])

  useEffect(() => {
    if (!page) return
    if (firstRun.current) { firstRun.current = false; return }
    setPage((p) => (p ? ({ ...p, display_name: name, bio } as Page) : p))
    const t = setTimeout(async () => {
      await supabase.from('pages').update({ display_name: name, bio }).eq('id', page.id)
      setSaved(true); setTimeout(() => setSaved(false), 1400)
    }, 600)
    return () => clearTimeout(t)
  }, [name, bio])

  async function loadLinks(pageId: string) {
    const { data } = await supabase.from('links').select('*').eq('page_id', pageId).order('position')
    setLinks((data || []) as Link[])
  }

  async function loadSub(uid: string) {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, price_interval, current_period_end, cancel_at_period_end')
      .eq('owner_id', uid)
      .maybeSingle()
    setSub(data || null)
  }

  async function deleteAccount() {
    if (!page) return
    setErr(''); setDeleting(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') },
        body: JSON.stringify({ confirm: delText.trim().toLowerCase() }),
      })
      const j = await res.json()
      if (j.ok) {
        try { window.localStorage.removeItem(PKEY) } catch (e) {}
        await supabase.auth.signOut()
        window.location.href = '/?closed=1'
        return
      }
      setErr(j.error || 'Could not delete the account.')
    } catch (e) {
      setErr('Could not reach the server. Nothing was deleted.')
    }
    setDeleting(false)
  }

  async function loadSocials(pageId: string) {
    const { data } = await supabase.from('socials').select('*').eq('page_id', pageId).order('position')
    setSocials((data || []) as Social[])
  }

  async function addSocial() {
    if (!page) return
    const v = socUrl.trim()
    if (!v) { setErr('Add a handle or a link first.'); return }
    if (socials.length >= 8) { setErr('Eight icons is the most a row can hold.'); return }
    setErr('')
    const { error } = await supabase.from('socials').insert({ page_id: page.id, platform: socPlat, url: v, position: socials.length })
    if (error) { setErr(error.message); return }
    setSocUrl('')
    await loadSocials(page.id)
  }

  async function removeSocial(id: string) {
    setSocials(socials.filter((x) => x.id !== id))
    await supabase.from('socials').delete().eq('id', id)
    if (page) await loadSocials(page.id)
  }

  async function loadStats(pageId: string) {
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data } = await supabase
      .from('click_events')
      .select('created_at, device, referrer, link_id')
      .eq('page_id', pageId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(3000)
    setEvents(data || [])
    setStatsLoaded(true)
  }

  function preview(fields: any) {
    const next = { ...pending, ...fields }
    setPending(next)
    try { window.localStorage.setItem(PKEY, JSON.stringify(next)) } catch (e) {}
  }

  function discardPreview() {
    setPending({})
    try { window.localStorage.removeItem(PKEY) } catch (e) {}
  }

  async function patch(fields: any) {
    if (!page) return
    const rest = { ...pending }
    Object.keys(fields).forEach((k) => { delete rest[k] })
    setPending(rest)
    try {
      if (Object.keys(rest).length) window.localStorage.setItem(PKEY, JSON.stringify(rest))
      else window.localStorage.removeItem(PKEY)
    } catch (e) {}
    setPage({ ...page, ...fields })
    await supabase.from('pages').update(fields).eq('id', page.id)
    setSaved(true); setTimeout(() => setSaved(false), 1400)
  }

  async function claimName() {
    setErr('')
    const n = claim.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._-]{0,28}[a-z0-9]$/.test(n) || /\.\./.test(n) || /--/.test(n)) {
      setErr('Letters, numbers, dots, dashes. Start and end with a letter or number.'); return
    }
    const { data, error } = await supabase.from('pages').insert({ owner_id: userId, username: n, display_name: n }).select().single()
    if (error) { setErr(error.message.indexOf('duplicate') >= 0 ? 'That name is taken. Try another.' : error.message); return }
    setPage(data as Page); setName(n)
  }

  async function addLink() {
    if (!page) return
    let u = url.trim()
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u
    if (!u) { setErr('Paste a link first.'); return }
    setErr(''); setAdding(true)

    let meta: any = {}
    try {
      const r = await fetch('/api/linkmeta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }) })
      meta = await r.json()
    } catch (e) {}

    let host = u
    try { host = new URL(u).hostname.replace(/^www\./, '') } catch (e) {}
    const finalTitle = title.trim() || meta.title || host

    const { error } = await supabase.from('links').insert({
      page_id: page.id, title: finalTitle, url: u, position: links.length,
      favicon_url: meta.favicon || null, site_title: null,
    })
    setAdding(false)
    if (error) { setErr(error.message); return }
    setTitle(''); setUrl('')
    await loadLinks(page.id)
  }

  async function removeLink(id: string) {
    setLinks(links.filter((l) => l.id !== id))
    await supabase.from('links').delete().eq('id', id)
    if (page) await loadLinks(page.id)
  }

  async function toggleActive(id: string) {
    const l = links.filter((x) => x.id === id)[0]
    if (!l) return
    const next = !l.is_active
    setLinks(links.map((x) => (x.id === id ? { ...x, is_active: next } : x)))
    await supabase.from('links').update({ is_active: next }).eq('id', id)
  }

  function onDrop(to: number) {
    const from = dragFrom.current
    dragFrom.current = null; setDragOver(null)
    if (from === null || from === to) return
    const next = links.slice()
    next.splice(to, 0, next.splice(from, 1)[0])
    setLinks(next)
    ;(async () => { for (let i = 0; i < next.length; i++) await supabase.from('links').update({ position: i }).eq('id', next[i].id) })()
  }

  async function makePrimary(id: string) {
    if (!page) return
    const target = links.filter((l) => l.id === id)[0]
    const off = target && target.is_primary
    setLinks(links.map((l) => ({ ...l, is_primary: !off && l.id === id })))
    await supabase.from('links').update({ is_primary: false }).eq('page_id', page.id)
    if (!off) await supabase.from('links').update({ is_primary: true }).eq('id', id)
  }

  async function pickTheme(t: Theme) {
    if (!page) return
    setErr('')
    if (t.tier === 'pro' && !isPro) { preview({ theme_id: t.id, use_custom: false }); return }
    patch({ theme_id: t.id, use_custom: false })
  }

  async function upload(bucket: string, file: File, cap: number, field: string) {
    if (!page || !userId) return
    if (file.size > cap) { setErr('That image is too large. Keep it under ' + Math.round(cap / 1048576) + 'MB.'); return }
    setErr('')
    bucket === 'avatars' ? setUploading(true) : setBgUploading(true)
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = userId + '/' + field + '-' + Date.now() + '.' + ext
    const { error: e } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (e) { setErr(e.message) } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const f: any = {}; f[field] = data.publicUrl
      if (isPro || field === 'avatar_url') await patch(f)
      else preview(f)
    }
    bucket === 'avatars' ? setUploading(false) : setBgUploading(false)
  }

  function copyUrl() {
    if (!page) return
    navigator.clipboard.writeText('https://relayme.bio/' + page.username)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  async function makeQr() {
    if (!page) return
    const mod: any = await import('qrcode')
    setQr(await mod.toDataURL('https://relayme.bio/' + page.username, { width: 640, margin: 2, color: { dark: '#1B0D44', light: '#FFFFFF' } }))
  }

  async function startCheckout(interval: string) {
    setErr(''); setBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') }, body: JSON.stringify({ interval }) })
      const j = await res.json()
      if (j.url) window.location.href = j.url
      else { setErr(j.error || 'Could not start checkout.'); setBusy(false) }
    } catch (e) { setErr('Could not reach the billing service.'); setBusy(false) }
  }

  async function openPortal() {
    setErr(''); setBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/portal', { method: 'POST', headers: { Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') } })
      const j = await res.json()
      if (j.url) window.location.href = j.url
      else { setErr(j.error || 'Could not open billing.'); setBusy(false) }
    } catch (e) { setErr('Could not reach the billing service.'); setBusy(false) }
  }

  if (!ready) return <main style={{ background: 'var(--base)', minHeight: '100vh' }} />

  if (!userId)
    return (
      <main className="centre">
        <Blob size={130} />
        <h1 style={{ fontSize: 28, margin: '12px 0 10px' }}>You are signed out</h1>
        <a href="/login" className="btn">Sign in</a>
      </main>
    )

  if (!page)
    return (
      <main className="centre">
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Blob size={130} />
          <h1 style={{ fontSize: 32, margin: '12px 0 6px' }}>Pick your name</h1>
          <p style={{ color: 'rgba(27,13,68,.7)', fontSize: 15, margin: '0 0 20px' }}>relayme.bio/<strong>{claim || 'yourname'}</strong></p>
          <input className="field" placeholder="yourname" value={claim} onChange={(e) => setClaim(e.target.value)} />
          <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={claimName}>Claim it</button>
          {err && <p className="err">{err}</p>}
        </div>
      </main>
    )

  const view = { ...page, ...pending } as Page
  const dirty = Object.keys(pending).length > 0
  const theme = themes.filter((t) => t.id === view.theme_id)[0]
  const nav = [
    { id: 'content', label: 'Content', icon: '▤' },
    { id: 'design', label: 'Design', icon: '◐' },
    { id: 'brand', label: 'Brand', icon: '✎' },
    { id: 'stats', label: 'Stats', icon: '◴' },
    { id: 'share', label: 'Share', icon: '↗' },
  ]

  // --- everything the Stats tab shows, worked out from the raw events ---
  const totalTaps = links.reduce((n, l) => n + (l.click_count || 0), 0)
  const now = Date.now()
  const within = (d: number) => events.filter((e) => now - new Date(e.created_at).getTime() < d * 86400000).length
  const days: { label: string; n: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now - i * 86400000); start.setHours(0, 0, 0, 0)
    const end = start.getTime() + 86400000
    days.push({
      label: start.toLocaleDateString(undefined, { day: 'numeric' }),
      n: events.filter((e) => { const t = new Date(e.created_at).getTime(); return t >= start.getTime() && t < end }).length,
    })
  }
  const peak = Math.max(1, ...days.map((d) => d.n))
  const mobile = events.filter((e) => e.device === 'mobile').length
  const desktop = events.filter((e) => e.device === 'desktop').length
  const refCount: any = {}
  events.forEach((e) => {
    if (!e.referrer) return
    let h = e.referrer
    try { h = new URL(e.referrer).hostname.replace(/^www\./, '') } catch (x) {}
    if (!h) return
    refCount[h] = (refCount[h] || 0) + 1
  })
  const topRefs = Object.keys(refCount).map((k) => ({ host: k, n: refCount[k] })).sort((a, b) => b.n - a.n).slice(0, 5)
  const topLinks = links.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 6)

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="shell">
        <header className="topbar">
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</span>
          <p className="topurl">relayme.bio/{page.username}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span className="saved">Saved</span>}
            <button className="btn small" onClick={copyUrl}>{copied ? 'Copied' : 'Share'}</button>
          </div>
        </header>

        <aside className="side">
          <nav className="sidenav">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)} className={tab === n.id ? 'navitem on' : 'navitem'}>
                <span className="navicon">{n.icon}</span>
                <span className="navlabel">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidefoot">
            <button className={(isPro ? 'chip chip-pro' : 'chip') + (tab === 'account' ? ' chipon' : '')}
              onClick={() => setTab('account')} title="Account and billing"
              style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {isPro ? 'Pro' : 'Free'}
            </button>
            <button className="btn small ghost" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>Sign out</button>
          </div>
        </aside>

        <div className="work">
          <div className="deco" aria-hidden="true">
            <Bear size={54} style={{ top: 42, left: 58, transform: 'rotate(-9deg)' }} />
            <Star color="#C6F15C" size={22} style={{ top: 132, left: 12, transform: 'rotate(14deg)' }} />
            <Squiggle color="#B0A0FF" size={58} style={{ top: 196, left: 74, transform: 'rotate(-6deg)' }} />
            <Rocket size={50} style={{ top: 292, left: 20, transform: 'rotate(18deg)' }} />
            <Star color="#F0A2FD" size={16} style={{ top: 402, left: 88, transform: 'rotate(-11deg)' }} />
            <Robot size={52} style={{ top: 470, left: 30, transform: 'rotate(-5deg)' }} />
            <Squiggle color="#FEB591" size={50} style={{ top: 588, left: 84, transform: 'rotate(11deg)' }} />
            <Star color="#B0A0FF" size={20} style={{ top: 664, left: 22, transform: 'rotate(22deg)' }} />
            <Bear size={44} style={{ top: 748, left: 66, transform: 'rotate(8deg)' }} />
            <Squiggle color="#C6F15C" size={46} style={{ top: 856, left: 16, transform: 'rotate(-14deg)' }} />
            <Rocket size={42} style={{ top: 942, left: 78, transform: 'rotate(-20deg)' }} />

            <Robot size={54} style={{ top: 66, right: 62, transform: 'rotate(7deg)' }} />
            <Squiggle color="#C6F15C" size={56} style={{ top: 158, right: 14, transform: 'rotate(-10deg)' }} />
            <Star color="#F0A2FD" size={20} style={{ top: 236, right: 86, transform: 'rotate(16deg)' }} />
            <Bear size={48} style={{ top: 318, right: 26, transform: 'rotate(-7deg)' }} />
            <Rocket size={46} style={{ top: 432, right: 76, transform: 'rotate(13deg)' }} />
            <Star color="#C6F15C" size={18} style={{ top: 534, right: 20, transform: 'rotate(-18deg)' }} />
            <Squiggle color="#B0A0FF" size={48} style={{ top: 604, right: 64, transform: 'rotate(9deg)' }} />
            <Robot size={44} style={{ top: 706, right: 18, transform: 'rotate(-12deg)' }} />
            <Star color="#B0A0FF" size={22} style={{ top: 820, right: 82, transform: 'rotate(5deg)' }} />
            <Squiggle color="#FEB591" size={44} style={{ top: 890, right: 28, transform: 'rotate(-16deg)' }} />
          </div>

          <section className="panel">
            {justUpgraded && <div className="banner">You are in. Everything is unlocked.</div>}

            {dirty && (
              <div className="trybar">
                <p><strong>You are trying out Pro.</strong> Nothing here is saved. Subscribe and these exact settings are applied to your page the moment you come back.</p>
                <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>Keep these — $30/yr</button>
                <button className="btn ghost" onClick={discardPreview}>Discard</button>
              </div>
            )}

            {tab === 'content' && (
              <div>
                <div className="block block-violet">
                  <h2 className="bh">Who are you?</h2>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                    <div className="av">
                      {page.avatar_url ? <img src={page.avatar_url} alt="" /> : <span>{(name || page.username).slice(0, 2).toUpperCase()}</span>}
                    </div>
                    <label className="btn small ghost" style={{ cursor: 'pointer' }}>
                      {uploading ? 'Uploading…' : 'Upload photo'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) upload('avatars', f, 2097152, 'avatar_url') }} />
                    </label>
                    {page.avatar_url && <button className="btn small ghost" onClick={() => patch({ avatar_url: null })}>Remove</button>}
                  </div>
                  <label className="label">Display name</label>
                  <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
                  <label className="label" style={{ marginTop: 14 }}>Bio</label>
                  <textarea ref={bioRef} className="field" rows={3} value={bio} placeholder="What do you make? Emoji welcome 🎧" onChange={(e) => setBio(clampChars(e.target.value, 200))} />
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(27,13,68,.55)' }}>{chars(bio).length}/200</p>
                </div>

                <div className="block block-mint">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Your links</h2>
                    <span className="counter">{links.length} {links.length === 1 ? 'link' : 'links'}</span>
                  </div>
                  <p className="bsub">Drag to reorder. Star makes it the big button. The eye hides it without deleting.</p>

                  {links.map((l, i) => (
                    <div key={l.id} draggable
                      onDragStart={() => { dragFrom.current = i }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={() => onDrop(i)}
                      onDragEnd={() => { dragFrom.current = null; setDragOver(null) }}
                      className={(dragOver === i ? 'row rowover' : 'row') + (l.is_active ? '' : ' hiddenrow')}>
                      <span className="grip">⠿</span>
                      {l.favicon_url ? <img className="fav" src={l.favicon_url} alt="" /> : <span className="fav favblank" />}
                      <div style={{ flex: 1, minWidth: 90 }}>
                        <p className="rowtitle">{l.title}</p>
                        <p className="rowmeta">{l.is_active ? '' : 'Hidden · '}{l.click_count} taps</p>
                      </div>
                      <button className="icon eyebtn" title={l.is_active ? 'Hide from your page' : 'Show on your page'} onClick={() => toggleActive(l.id)}>{l.is_active ? '◉' : '○'}</button>
                      <button className={l.is_primary ? 'icon on' : 'icon'} title="Make this the main link" onClick={() => makePrimary(l.id)}>★</button>
                      <button className="icon" title="Delete" onClick={() => removeLink(l.id)}>✕</button>
                    </div>
                  ))}
                  {links.length === 0 && <p className="bsub">Nothing to relay yet. Add your first link below.</p>}

                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(27,13,68,.12)' }}>
                      <input className="field" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                      <input className="field" style={{ marginTop: 10 }} placeholder="Title (optional — we read it from the site)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
                    <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={addLink} disabled={adding}>
                      {adding ? 'Reading the site…' : 'Add link'}
                    </button>
                  </div>
                </div>

                <div className="block block-plain">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Social icons</h2>
                    <span className="counter">{socials.length} of 8</span>
                  </div>
                  <p className="bsub">A small row of icons under your bio. A handle is enough — we build the link.</p>

                  {socials.length > 0 && (
                    <div className="socrow">
                      {socials.map((sc) => (
                        <div key={sc.id} className="socpill">
                          <SocialIcon id={sc.platform} color="#1B0D44" size={18} />
                          <span className="soctext">{sc.url}</span>
                          <button className="icon" title="Remove" onClick={() => removeSocial(sc.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="socadd">
                    <select className="field socsel" value={socPlat} onChange={(e) => setSocPlat(e.target.value)}>
                      {SOCIALS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                    <input className="field" placeholder={(SOCIALS.filter((x) => x.id === socPlat)[0] || SOCIALS[0]).hint}
                      value={socUrl} onChange={(e) => setSocUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addSocial() }} />
                    <button className="btn" onClick={addSocial}>Add</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'stats' && (
              <div>
                <div className="block block-mint">
                  <h2 className="bh">Taps</h2>
                  <p className="bsub">Every tap on every link, counted since your page went up.</p>
                  <div className="statgrid">
                    <div className="stat"><p className="statnum">{totalTaps}</p><p className="statlab">all time</p></div>
                    <div className="stat"><p className="statnum">{within(30)}</p><p className="statlab">last 30 days</p></div>
                    <div className="stat"><p className="statnum">{within(7)}</p><p className="statlab">last 7 days</p></div>
                    <div className="stat"><p className="statnum">{within(1)}</p><p className="statlab">today</p></div>
                  </div>
                </div>

                <div className="block block-plain">
                  <h2 className="bh">Last fourteen days</h2>
                  {!statsLoaded && <p className="bsub">Counting…</p>}
                  {statsLoaded && (
                    <div className="bars">
                      {days.map((d, i) => (
                        <div key={i} className="barcol" title={d.n + ' taps'}>
                          <div className="bartrack">
                            <div className="bar" style={{ height: Math.round((d.n / peak) * 100) + '%' }} />
                          </div>
                          <span className="barlab">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {statsLoaded && events.length === 0 && (
                    <p className="bsub" style={{ marginTop: 14, marginBottom: 0 }}>Nothing tapped yet. Share your link and come back.</p>
                  )}
                </div>

                <div className="block block-violet">
                  <h2 className="bh">Which links people tap</h2>
                  {topLinks.length === 0 && <p className="bsub" style={{ marginBottom: 0 }}>Add a link first.</p>}
                  {topLinks.map((l) => (
                    <div key={l.id} className="statrow">
                      <span className="statrowname">{l.title}</span>
                      <span className="statrowbar"><span style={{ width: Math.round(((l.click_count || 0) / Math.max(1, topLinks[0].click_count || 1)) * 100) + '%' }} /></span>
                      <span className="statrownum">{l.click_count || 0}</span>
                    </div>
                  ))}
                </div>

                <div className="block block-sun">
                  <h2 className="bh">Where they come from</h2>
                  <p className="bsub">Referrers and devices, last thirty days.</p>
                  <div className="statgrid">
                    <div className="stat"><p className="statnum">{mobile}</p><p className="statlab">on a phone</p></div>
                    <div className="stat"><p className="statnum">{desktop}</p><p className="statlab">on a computer</p></div>
                  </div>
                  {topRefs.length > 0 ? (
                    <div style={{ marginTop: 16 }}>
                      {topRefs.map((r) => (
                        <div key={r.host} className="statrow">
                          <span className="statrowname">{r.host}</span>
                          <span className="statrowbar"><span style={{ width: Math.round((r.n / topRefs[0].n) * 100) + '%' }} /></span>
                          <span className="statrownum">{r.n}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="bsub" style={{ marginTop: 14, marginBottom: 0 }}>
                      No referrers yet. Most apps strip them, so a blank list here is normal.
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === 'design' && (
              <div>
                <div className="block block-sun">
                  <h2 className="bh">Pick a look</h2>
                  <p className="bsub">Two are free. Tap any Pro one to try it — the preview updates straight away.</p>
                  <div className="themegrid">
                    {themes.map((t) => {
                      const locked = t.tier === 'pro' && !isPro
                      return (
                        <button key={t.id} onClick={() => pickTheme(t)} className={!view.use_custom && t.id === view.theme_id ? 'swatch on' : 'swatch'}>
                          <div style={{ height: 84, background: t.bg, backgroundSize: 'cover', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, padding: '0 11px 11px' }}>
                            <span style={{ height: 10, borderRadius: 5, background: t.accent_bg }} />
                            <span style={{ height: 10, borderRadius: 5, background: t.button_bg }} />
                          </div>
                          <div className="swname"><span>{t.name}</span>{locked && <span className="prodot">Pro</span>}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {!isPro && (
                  <div className="block block-bloom">
                    <h2 className="bh">Unlock the rest</h2>
                    <p className="bsub">Thirty themes, six fonts, your own colours and a background image. Try any of it now — you only pay to keep it.</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                      <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>{busy ? 'One moment…' : '$30 a year'}</button>
                      <button className="btn ghost" onClick={() => startCheckout('month')} disabled={busy}>$4 a month</button>
                    </div>
                  </div>
                )}

                {isPro && (
                  <div className="block block-plain" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Every theme is yours.</p>
                    <button className="btn small ghost" onClick={() => setTab('account')}>Account and billing</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'brand' && (
              <div>
                <div className="block block-plain">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Font</h2>
                    {!isPro && <span className="prodot">Pro</span>}
                  </div>
                  <p className="bsub">Manrope is free. Tap any other to try it on your page.</p>
                  <div className="fontgrid">
                    {FONTS.map((f) => {
                      const free = isPro || f.id === FREE_FONT
                      return (
                        <button key={f.id}
                          onClick={() => (free ? patch({ font_family: f.id }) : preview({ font_family: f.id }))}
                          className={view.font_family === f.id ? 'fontbtn on' : 'fontbtn'}
                          style={{ fontFamily: f.stack }}>
                          {f.name}{!free && <span className="trylock"> Pro</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="block block-plain">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Your colours</h2>
                    {!isPro && <span className="prodot">Pro</span>}
                  </div>
                  <p className="bsub">Override the theme with your brand palette. Free accounts can try it, Pro keeps it.</p>
                  <label className="switch">
                    <input type="checkbox" checked={!!view.use_custom}
                      onChange={(e) => (isPro ? patch({ use_custom: e.target.checked }) : preview({ use_custom: e.target.checked }))} />
                    <span>Use my colours</span>
                  </label>
                  <div className="colgrid">
                    {[
                      { k: 'custom_bg', label: 'Background', d: '#F6F2FF' },
                      { k: 'custom_button_bg', label: 'Buttons', d: '#FFFFFF' },
                      { k: 'custom_button_text', label: 'Button text', d: '#1B0D44' },
                      { k: 'custom_accent_bg', label: 'Main link', d: '#C6F15C' },
                    ].map((c) => (
                      <div key={c.k} className="colitem">
                        <span className="collabel">{c.label}</span>
                        <input type="color" value={(view as any)[c.k] || c.d}
                          onChange={(e) => { const f: any = {}; f[c.k] = e.target.value; f.use_custom = true; isPro ? patch(f) : preview(f) }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="block block-plain">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Background image</h2>
                    {!isPro && <span className="prodot">Pro</span>}
                  </div>
                  <p className="bsub">Sits behind everything. Under 4MB. Free accounts can try it, Pro keeps it.</p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label className="btn small ghost" style={{ cursor: 'pointer' }}>
                      {bgUploading ? 'Uploading…' : 'Upload image'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) upload('backgrounds', f, 4194304, 'bg_image_url') }} />
                    </label>
                    {view.bg_image_url && <button className="btn small ghost" onClick={() => (isPro ? patch({ bg_image_url: null }) : preview({ bg_image_url: null }))}>Remove</button>}
                  </div>
                </div>

                {!isPro && (
                  <div className="block block-bloom">
                    <h2 className="bh">Make it yours</h2>
                    <p className="bsub">Fonts, colours and backgrounds are part of Pro.</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                      <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>$30 a year</button>
                      <button className="btn ghost" onClick={() => startCheckout('month')} disabled={busy}>$4 a month</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'account' && (
              <div>
                <div className={isPro ? 'block block-violet' : 'block block-plain'}>
                  <div className="planrow">
                    <h2 className="bh" style={{ margin: 0 }}>Account settings</h2>
                    <span className={isPro ? 'planbadge pro' : 'planbadge'}>{isPro ? 'PRO' : 'FREE'}</span>
                  </div>

                  <ul className="planfacts">
                    <li><span>Signed in as</span><span style={{ overflowWrap: 'anywhere' }}>{userEmail || '—'}</span></li>
                    <li><span>Your page</span><span style={{ overflowWrap: 'anywhere' }}>relayme.bio/{page.username}</span></li>
                    <li><span>Page status</span><span>{page.is_published ? 'Live' : 'Not published'}</span></li>
                    <li><span>Plan</span><span>{isPro ? (sub && sub.price_interval === 'month' ? 'Pro, $4 a month' : 'Pro, $30 a year') : 'Free'}</span></li>
                    {isPro && sub && sub.current_period_end && (
                      <li>
                        <span>{sub.cancel_at_period_end ? 'Pro ends' : 'Renews'}</span>
                        <span>{new Date(sub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </li>
                    )}
                    <li><span>Links</span><span>{links.length}</span></li>
                    <li><span>Total taps</span><span>{totalTaps}</span></li>
                  </ul>

                  {isPro && sub && sub.cancel_at_period_end && (
                    <p className="bsub" style={{ marginTop: 16, marginBottom: 0 }}>
                      This subscription is set to end. Your page stays online either way — only the
                      Pro styling reverts.
                    </p>
                  )}
                </div>

                <div className="block block-plain">
                  <h2 className="bh">Billing</h2>
                  {isPro ? (
                    <>
                      <p className="bsub">
                        Change your card, download invoices, switch between monthly and yearly, or cancel.
                        Cancelling stops the next charge and you keep Pro until the period ends.
                      </p>
                      <button className="btn" onClick={openPortal} disabled={busy}>
                        {busy ? 'One moment…' : 'Manage billing and cancel'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="bsub">You are on the free plan, so there is nothing to bill.</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>Go Pro — $30 a year</button>
                        <button className="btn ghost" onClick={() => startCheckout('month')} disabled={busy}>$4 a month</button>
                      </div>
                    </>
                  )}
                </div>

                <div className="block danger">
                  <h2 className="bh">Delete my account</h2>
                  <p className="bsub" style={{ marginBottom: 0 }}>
                    This cannot be undone. Be sure before you start.
                  </p>

                  {!delOpen ? (
                    <button className="btn dangerbtn" style={{ marginTop: 14 }} onClick={() => { setDelOpen(true); setErr('') }}>
                      Delete my account
                    </button>
                  ) : (
                    <div className="dangerbox">
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Everything below goes, permanently:</p>
                      <ul className="dangerlist">
                        <li>your page at relayme.bio/{page.username}, which will stop working immediately</li>
                        <li>all {links.length} of your links, and their tap history</li>
                        <li>your photo, background image, bio and social icons</li>
                        <li>your username, which someone else may then claim</li>
                        {isPro && <li><strong>your Pro subscription, cancelled straight away with no refund for the remainder of the period</strong></li>}
                      </ul>
                      <p style={{ margin: '0 0 10px', fontSize: 14.5 }}>
                        Type <strong>{page.username}</strong> to confirm.
                      </p>
                      <input className="field" value={delText} placeholder={page.username}
                        onChange={(e) => setDelText(e.target.value)} autoComplete="off" />
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        <button className="btn dangerbtn" disabled={deleting || delText.trim().toLowerCase() !== page.username}
                          onClick={deleteAccount}>
                          {deleting ? 'Deleting…' : 'Delete permanently'}
                        </button>
                        <button className="btn ghost" onClick={() => { setDelOpen(false); setDelText('') }} disabled={deleting}>
                          Keep my account
                        </button>
                      </div>
                      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(27,13,68,.6)' }}>
                        We will email you a confirmation once it is done.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'share' && (
              <div className="block block-violet">
                <h2 className="bh">Your link</h2>
                <p className="biglink">relayme.bio/{page.username}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={copyUrl}>{copied ? 'Copied' : 'Copy link'}</button>
                  <a className="btn ghost" href={'/' + page.username} target="_blank" rel="noopener">Open page</a>
                  <button className="btn ghost" onClick={makeQr}>Make a QR code</button>
                </div>
                {qr && (
                  <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <img src={qr} alt="QR code for your Relay page" style={{ width: 200, height: 200, borderRadius: 16 }} />
                    <div><a className="btn small" href={qr} download={page.username + '-relay-qr.png'} style={{ marginTop: 12 }}>Download</a></div>
                  </div>
                )}
                <p className="bsub" style={{ marginTop: 18, marginBottom: 0 }}>Paste it in your Instagram, TikTok or X bio. It works anywhere a link does.</p>
              </div>
            )}

            {err && <p className="err">{err}</p>}
          </section>

          <aside className="preview">
            <Star color="#C6F15C" size={28} style={{ position: 'absolute', top: 30, right: 8 }} />
            <Star color="#F0A2FD" size={18} style={{ position: 'absolute', top: 250, left: 0 }} />
            <Star color="#B0A0FF" size={22} style={{ position: 'absolute', bottom: 60, right: 14 }} />
            <div className="previewinner">
              <Phone page={view} links={links} theme={theme} showBrand={true} socials={socials} />
              <p className="previewcap">Live preview</p>
              {links.filter((l) => l.is_active).length > 5 && (
                <p className="previewhint">Scroll inside the phone to see the rest</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
