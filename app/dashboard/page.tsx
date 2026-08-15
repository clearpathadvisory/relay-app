'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { supabase, Theme, Link, Page, Social, FONTS } from '../../lib/supabase'
import { SOCIALS, SocialIcon, socialHref, socialName } from '../socialicons'
import { scheduleState, scheduleLabel } from '../../lib/schedule'
import { detectEmbed, embedName } from '../../lib/embed'
import { Blob, Star, Robot, Bear, Rocket, Squiggle } from '../blob'
import { BlobMark } from '../blobmark'
import { Phone } from './phone'
import { Countries } from '../countries'

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
  const [addKind, setAddKind] = useState<'link' | 'heading'>('link')
  const [headingText, setHeadingText] = useState('')
  const [thumbBusy, setThumbBusy] = useState<string | null>(null)
  const [thumbFor, setThumbFor] = useState<string | null>(null)
  const [socSuggest, setSocSuggest] = useState<string | null>(null)
  const [titleBusy, setTitleBusy] = useState<string | null>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [subsLoaded, setSubsLoaded] = useState(false)
  const [capHeading, setCapHeading] = useState('')
  const [capButton, setCapButton] = useState('')
  const [capNote, setCapNote] = useState('')
  const [scheduleFor, setScheduleFor] = useState<string | null>(null)
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
  const [confirmLink, setConfirmLink] = useState<string | null>(null)
  const [editSocial, setEditSocial] = useState<string | null>(null)
  const [editSocialUrl, setEditSocialUrl] = useState('')
  const socFrom = useRef<number | null>(null)
  const [socOver, setSocOver] = useState<number | null>(null)
  const [totalViews, setTotalViews] = useState(0)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [pubBusy, setPubBusy] = useState(false)
  const liveTimer = useRef<any>(null)

  const isPro = plan === 'pro'

  useEffect(() => {
    let cancelled = false
    async function waitForSession() {
      // A session that exists is in localStorage already, so the first read
      // finds it. The polling is only for the moment just after a magic link,
      // when the token is still being exchanged — and that only happens when
      // there is something in the URL to exchange.
      const { data: first } = await supabase.auth.getSession()
      if (first.session) return first.session
      const arriving = typeof window !== 'undefined' && (window.location.hash || window.location.search)
      if (!arriving) return null
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 200))
        const { data } = await supabase.auth.getSession()
        if (data.session) return data.session
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
          setPage(pg as Page); setName(pg.display_name || ''); setBio(pg.bio || ''); setSeoTitle(pg.seo_title || ''); setSeoDesc(pg.seo_desc || '');
          setCapHeading(pg.capture_heading || ''); setCapButton(pg.capture_button || ''); setCapNote(pg.capture_note || ''); await loadLinks(pg.id); await loadSocials(pg.id); await loadSub(uid)
        }
      }
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (tab === 'stats' && page && !statsLoaded) loadStats(page.id)
    if (tab === 'audience' && page && !subsLoaded) loadSubs(page.id)
  }, [tab, page, statsLoaded, subsLoaded])


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
      pushLive()
    }, 600)
    return () => clearTimeout(t)
  }, [name, bio])

  // The public page is cached for a minute, so without this an edit sits
  // invisible while the editor says "Saved". Debounced, because a burst of
  // small edits should cost one rebuild, not ten.
  function pushLive() {
    if (liveTimer.current) clearTimeout(liveTimer.current)
    liveTimer.current = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + (data.session ? data.session.access_token : '') },
        })
      } catch (e) {}
    }, 1200)
  }

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

  // A social icon points at a profile. Someone pasting a video or a track into
  // it almost always wants the thing itself on the page, not a small icon that
  // sends people away — so say so before adding it, rather than after.
  async function addSocial(force = false) {
    if (!page) return
    const v = socUrl.trim()
    if (!v) { setErr('Add a handle or a link first.'); return }
    if (socials.length >= 8) { setErr('8 icons is the most a row can hold.'); return }

    const playable = detectEmbed(v)
    if (playable && !force) { setErr(''); setSocSuggest(v); return }

    setErr(''); setSocSuggest(null)
    const { error } = await supabase.from('socials').insert({ page_id: page.id, platform: socPlat, url: v, position: socials.length })
    if (error) { setErr(error.message); return }
    setSocUrl('')
    await loadSocials(page.id)
    pushLive()
  }

  async function removeSocial(id: string) {
    setSocials(socials.filter((x) => x.id !== id))
    await supabase.from('socials').delete().eq('id', id)
    if (page) await loadSocials(page.id)
    pushLive()
  }

  async function saveSocial(id: string) {
    const v = editSocialUrl.trim()
    if (!v) { setErr('A handle or link is needed.'); return }
    setErr('')
    setSocials(socials.map((x) => (x.id === id ? { ...x, url: v } : x)))
    setEditSocial(null)
    await supabase.from('socials').update({ url: v }).eq('id', id)
    pushLive()
  }

  async function saveSocialOrder(next: Social[]) {
    setSocials(next)
    for (let k = 0; k < next.length; k++) {
      await supabase.from('socials').update({ position: k }).eq('id', next[k].id)
    }
    pushLive()
  }

  function moveSocial(i: number, by: number) {
    const to = i + by
    if (to < 0 || to >= socials.length) return
    const next = socials.slice()
    const [row] = next.splice(i, 1)
    next.splice(to, 0, row)
    saveSocialOrder(next)
  }

  function onSocialDrop(to: number) {
    const from = socFrom.current
    socFrom.current = null; setSocOver(null)
    if (from === null || from === to) return
    const next = socials.slice()
    next.splice(to, 0, next.splice(from, 1)[0])
    saveSocialOrder(next)
  }

  // Publishing is a switch, not a deletion. Someone who wants their page down
  // for a week should not have to close their account to get it.
  async function setPublished(next: boolean) {
    if (!page) return
    setErr(''); setPubBusy(true)
    setPage({ ...page, is_published: next })
    await supabase.from('pages').update({ is_published: next }).eq('id', page.id)
    setPubBusy(false)
    setSaved(true); setTimeout(() => setSaved(false), 1400)
    pushLive()
  }

  async function saveSeo() {
    if (!page) return
    await patch({ seo_title: seoTitle.trim() || null, seo_desc: seoDesc.trim() || null })
  }

  async function loadSubs(pageId: string) {
    const { data } = await supabase
      .from('subscribers')
      .select('id, email, created_at, confirmed_at')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .limit(2000)
    setSubs(data || [])
    setSubsLoaded(true)
  }

  // Only confirmed addresses leave the building. An unconfirmed one is a
  // stranger's typing, not a subscriber, and exporting it would hand the owner
  // a list they have no permission to email.
  function downloadList() {
    const rows = subs.filter((x) => x.confirmed_at)
    const csv = ['email,confirmed_at']
      .concat(rows.map((r) => '"' + String(r.email).replace(/"/g, '""') + '","' + r.confirmed_at + '"'))
      .join('\n')
    // the mascot component is also called Blob, so reach for the browser's one
    const blob = new window.Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (page ? page.username : 'relay') + '-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function removeSub(id: string) {
    setSubs(subs.filter((x) => x.id !== id))
    await supabase.from('subscribers').delete().eq('id', id)
  }

  async function saveCapture() {
    await patch({
      capture_heading: capHeading.trim() || null,
      capture_button: capButton.trim() || null,
      capture_note: capNote.trim() || null,
    })
  }

  async function loadStats(pageId: string) {
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data } = await supabase
      .from('click_events')
      .select('created_at, device, referrer, link_id')
      .eq('page_id', pageId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(6000)
    setEvents(data || [])
    // a page view is a row with no link on it
    const { count } = await supabase
      .from('click_events')
      .select('id', { count: 'exact', head: true })
      .eq('page_id', pageId)
      .is('link_id', null)
    setTotalViews(count || 0)
    setStatsLoaded(true)
  }

  function preview(fields: any) {
    const next = { ...pending, ...fields }
    setPending(next)
    try { window.localStorage.setItem(PKEY, JSON.stringify(next)) } catch (e) {}
  }

  function unpreview(keys: string[]) {
    const next = { ...pending }
    keys.forEach((k) => { delete next[k] })
    setPending(next)
    try {
      if (Object.keys(next).length) window.localStorage.setItem(PKEY, JSON.stringify(next))
      else window.localStorage.removeItem(PKEY)
    } catch (e) {}
  }

  const COLOUR_KEYS = ['use_custom', 'custom_bg', 'custom_button_bg', 'custom_button_text', 'custom_accent_bg']

  function resetColours() {
    setErr('')
    if (isPro) {
      patch({ use_custom: false, custom_bg: null, custom_button_bg: null, custom_button_text: null, custom_accent_bg: null })
    } else {
      // for a free account these were only ever a preview, so take them back out
      unpreview(COLOUR_KEYS)
    }
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
    pushLive()
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

  // Reuses the shrink and upload path the avatar already uses. 256 square is
  // ample for a 28px circle on a phone and keeps the page light.
  async function uploadThumb(linkId: string, file: File) {
    if (!isPro) { setErr('Your own image on a link is a Pro feature.'); return }
    if (!file.type.startsWith('image/')) { setErr('That needs to be an image.'); return }
    if (file.size > 4 * 1024 * 1024) { setErr('Under 4MB, please.'); return }
    setErr(''); setThumbBusy(linkId)

    const body = await shrink(file, 256, true)
    const path = userId + '/' + linkId + '-' + Date.now() + '.jpg'
    const { error: e } = await supabase.storage.from('thumbs').upload(path, body, {
      upsert: true, contentType: body.type || 'image/jpeg',
    })
    if (e) { setErr(e.message); setThumbBusy(null); return }

    const { data } = supabase.storage.from('thumbs').getPublicUrl(path)
    await supabase.from('links').update({ image_url: data.publicUrl }).eq('id', linkId)
    setThumbBusy(null)
    if (page) await loadLinks(page.id)
    pushLive()
  }

  async function clearThumb(linkId: string) {
    setErr('')
    await supabase.from('links').update({ image_url: null }).eq('id', linkId)
    if (page) await loadLinks(page.id)
    pushLive()
  }

  // datetime-local hands back wall-clock text with no zone. new Date() reads it
  // in the browser's own zone, which is what the person means when they type it.
  async function setWindow(linkId: string, field: 'starts_at' | 'ends_at', local: string) {
    if (!isPro) { setErr('Scheduling a link is a Pro feature.'); return }
    const value = local ? new Date(local).toISOString() : null

    const row = links.filter((l) => l.id === linkId)[0]
    if (row && value) {
      const other = field === 'starts_at' ? row.ends_at : row.starts_at
      if (other) {
        const a = field === 'starts_at' ? new Date(value) : new Date(other)
        const b = field === 'starts_at' ? new Date(other) : new Date(value)
        if (b <= a) { setErr('The end has to come after the start.'); return }
      }
    }

    setErr('')
    const patchRow: any = {}
    patchRow[field] = value
    setLinks(links.map((l) => (l.id === linkId ? { ...l, ...patchRow } : l)))
    const { error } = await supabase.from('links').update(patchRow).eq('id', linkId)
    if (error) { setErr(error.message); return }
    if (page) await loadLinks(page.id)
    pushLive()
  }

  // Takes the url out of the icon field and puts it in the list as a link,
  // playing inline where the plan allows it.
  async function socialToLink() {
    if (!page || !socSuggest) return
    const u = socSuggest
    const playable = detectEmbed(u)
    setErr(''); setSocSuggest(null); setAdding(true)

    let meta: any = {}
    try {
      const { data: sess } = await supabase.auth.getSession()
      const r = await fetch('/api/linkmeta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (sess.session ? sess.session.access_token : '') },
        body: JSON.stringify({ url: u }),
      })
      meta = await r.json()
    } catch (e) {}

    let host = u
    try { host = new URL(u).hostname.replace(/^www\./, '') } catch (e) {}

    const { error } = await supabase.from('links').insert({
      page_id: page.id, kind: 'link', title: meta.title || host, url: u,
      position: links.length, favicon_url: meta.favicon || null, site_title: null,
      embed_kind: isPro && playable ? playable.kind : null,
    })
    setAdding(false)
    if (error) { setErr(error.message); return }
    setSocUrl('')
    await loadLinks(page.id)
    pushLive()
  }

  // Titles fetched before the lookup was fixed read as "Spotify" or a bare
  // hostname. Deleting and re-adding would throw away that link's taps, so the
  // title can be fetched again in place.
  async function refetchTitle(linkId: string) {
    const row = links.filter((l) => l.id === linkId)[0]
    if (!row || !row.url) return
    setErr(''); setTitleBusy(linkId)
    try {
      const { data: sess } = await supabase.auth.getSession()
      const r = await fetch('/api/linkmeta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (sess.session ? sess.session.access_token : '') },
        body: JSON.stringify({ url: row.url }),
      })
      const meta = await r.json()
      if (meta && meta.title) {
        const patchRow: any = { title: meta.title }
        if (meta.favicon && !row.image_url) patchRow.favicon_url = meta.favicon
        await supabase.from('links').update(patchRow).eq('id', linkId)
        if (page) await loadLinks(page.id)
        pushLive()
      } else {
        setErr('That site did not give us a title.')
      }
    } catch (e) {
      setErr('Could not reach that site.')
    }
    setTitleBusy(null)
  }

  async function toggleEmbed(linkId: string) {
    if (!isPro) { setErr('Playing a link inline is a Pro feature.'); return }
    const row = links.filter((l) => l.id === linkId)[0]
    if (!row) return
    const playable = detectEmbed(row.url)
    if (!playable) { setErr('That link is not something we can play here.'); return }

    const next = row.embed_kind ? null : playable.kind
    setErr('')
    setLinks(links.map((l) => (l.id === linkId ? { ...l, embed_kind: next } : l)))
    await supabase.from('links').update({ embed_kind: next }).eq('id', linkId)
    if (page) await loadLinks(page.id)
    pushLive()
  }

  async function clearWindow(linkId: string) {
    setErr('')
    await supabase.from('links').update({ starts_at: null, ends_at: null }).eq('id', linkId)
    if (page) await loadLinks(page.id)
    pushLive()
  }

  // the value a datetime-local input wants: local wall clock, no zone, no seconds
  function toLocalInput(iso: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  }

  async function addLink() {
    if (!page) return
    let u = url.trim()
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u
    if (!u) { setErr('Paste a link first.'); return }
    setErr(''); setAdding(true)

    let meta: any = {}
    try {
      const { data: sess } = await supabase.auth.getSession()
      const r = await fetch('/api/linkmeta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (sess.session ? sess.session.access_token : ''),
        },
        body: JSON.stringify({ url: u }),
      })
      meta = await r.json()
    } catch (e) {}

    let host = u
    try { host = new URL(u).hostname.replace(/^www\./, '') } catch (e) {}
    const finalTitle = title.trim() || meta.title || host

    // if it can play inline, it does — a Pro account should not have to find a
    // switch to get the thing the feature is for
    const playable = detectEmbed(u)
    const { error } = await supabase.from('links').insert({
      page_id: page.id, kind: 'link', title: finalTitle, url: u, position: links.length,
      favicon_url: meta.favicon || null, site_title: null,
      embed_kind: isPro && playable ? playable.kind : null,
    })
    setAdding(false)
    if (error) { setErr(error.message); return }
    setTitle(''); setUrl('')
    await loadLinks(page.id)
    pushLive()
  }

  // A row that is not a link. Past about eight links a page becomes a wall,
  // and a heading every few rows is the cheapest way to make it readable.
  // A heading exists to head the rows after it. Appended to the bottom there
  // are none, so it heads nothing and looks broken. It goes to the top, where
  // it immediately groups the whole list, and the arrows walk it down to where
  // the group actually starts.
  async function addRow(kind: 'heading' | 'divider', title: string | null) {
    if (!page) return
    setErr('')
    const { error } = await supabase.from('links').insert({
      page_id: page.id, kind, title, url: null, position: -1,
    })
    if (error) { setErr(error.message); return }

    const { data: fresh } = await supabase
      .from('links').select('*').eq('page_id', page.id)
      .order('position').order('created_at')
    const rows = (fresh || []) as Link[]
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].position !== i) await supabase.from('links').update({ position: i }).eq('id', rows[i].id)
    }

    setHeadingText(''); setAddKind('link')
    await loadLinks(page.id)
    pushLive()
  }

  async function addHeading() {
    const t = headingText.trim()
    if (!t) { setErr('Give the heading some words.'); return }
    await addRow('heading', t)
  }

  async function addDivider() {
    await addRow('divider', null)
  }

  async function removeLink(id: string) {
    setConfirmLink(null)
    setLinks(links.filter((l) => l.id !== id))
    await supabase.from('links').delete().eq('id', id)
    if (page) await loadLinks(page.id)
    pushLive()
  }

  async function toggleActive(id: string) {
    const l = links.filter((x) => x.id === id)[0]
    if (!l) return
    const next = !l.is_active
    setLinks(links.map((x) => (x.id === id ? { ...x, is_active: next } : x)))
    await supabase.from('links').update({ is_active: next }).eq('id', id)
    pushLive()
  }

  async function saveOrder(next: Link[]) {
    setLinks(next)
    for (let i = 0; i < next.length; i++) {
      await supabase.from('links').update({ position: i }).eq('id', next[i].id)
    }
    pushLive()
  }

  function onDrop(to: number) {
    const from = dragFrom.current
    dragFrom.current = null; setDragOver(null)
    if (from === null || from === to) return
    const next = links.slice()
    next.splice(to, 0, next.splice(from, 1)[0])
    saveOrder(next)
  }

  // HTML5 drag events never fire on a touch screen, and the drag handle is
  // hidden below 700px, so on a phone the order used to be whatever order the
  // links were added in. These work everywhere and need no gesture.
  function move(i: number, by: number) {
    const to = i + by
    if (to < 0 || to >= links.length) return
    const next = links.slice()
    const [row] = next.splice(i, 1)
    next.splice(to, 0, row)
    saveOrder(next)
  }

  async function makePrimary(id: string) {
    if (!page) return
    const target = links.filter((l) => l.id === id)[0]
    const off = target && target.is_primary
    setLinks(links.map((l) => ({ ...l, is_primary: !off && l.id === id })))
    await supabase.from('links').update({ is_primary: false }).eq('page_id', page.id)
    if (!off) await supabase.from('links').update({ is_primary: true }).eq('id', id)
    pushLive()
  }

  async function pickTheme(t: Theme) {
    if (!page) return
    setErr('')
    if (t.tier === 'pro' && !isPro) { preview({ theme_id: t.id, use_custom: false }); return }
    patch({ theme_id: t.id, use_custom: false })
  }

  // A phone photo is several thousand pixels wide and a couple of megabytes.
  // It was being served untouched into a 96px circle on the page that matters
  // most, which made it the largest thing on a visitor's first paint.
  async function shrink(file: File, max: number, square: boolean): Promise<Blob> {
    try {
      const img = document.createElement('img')
      const url = URL.createObjectURL(file)
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url })
      const w = img.naturalWidth, h = img.naturalHeight
      if (!w || !h || (w <= max && h <= max && file.size < 400000)) { URL.revokeObjectURL(url); return file }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); return file }

      if (square) {
        // centre crop, because an avatar is displayed as a circle anyway
        const side = Math.min(w, h)
        canvas.width = Math.min(max, side); canvas.height = canvas.width
        ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
      } else {
        const scale = Math.min(1, max / Math.max(w, h))
        canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      URL.revokeObjectURL(url)

      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.86))
      return blob && blob.size < file.size ? blob : file
    } catch (e) {
      return file
    }
  }

  async function upload(bucket: string, file: File, cap: number, field: string) {
    if (!page || !userId) return
    if (file.size > cap) { setErr('That image is too large. Keep it under ' + Math.round(cap / 1048576) + 'MB.'); return }
    setErr('')
    bucket === 'avatars' ? setUploading(true) : setBgUploading(true)

    const isAvatar = bucket === 'avatars'
    const body = await shrink(file, isAvatar ? 512 : 1800, isAvatar)
    const ext = body === file ? (file.name.split('.').pop() || 'png').toLowerCase() : 'jpg'
    const path = userId + '/' + field + '-' + Date.now() + '.' + ext
    const { error: e } = await supabase.storage.from(bucket).upload(path, body, { upsert: true, contentType: body.type || undefined })
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
          <p style={{ color: 'var(--ink-70)', fontSize: 15, margin: '0 0 20px' }}>relayme.bio/<strong>{claim || 'yourname'}</strong></p>
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
    { id: 'audience', label: 'Emails', icon: '✉' },
    { id: 'account', label: 'Account', icon: '⚙' },
  ]

  // --- everything the Stats tab shows, worked out from the raw events ---
  const linkCount = links.filter((l) => l.kind === 'link').length
  const confirmedSubs = subs.filter((x) => x.confirmed_at)
  const pendingSubs = subs.filter((x) => !x.confirmed_at)
  // A heading or divider with no link beneath it before the next heading is
  // decoration heading nothing. Worth pointing out, not worth forbidding.
  function emptyGroup(i: number) {
    const row = links[i]
    if (!row || row.kind === 'link') return false
    for (let k = i + 1; k < links.length; k++) {
      if (links[k].kind === 'link') return false
      if (links[k].kind === 'heading') return true
    }
    return true
  }
  const totalTaps = links.reduce((n, l) => n + (l.click_count || 0), 0)
  const now = Date.now()
  // a row with a link on it is a tap; a row without one is a page view
  const tapEvents = events.filter((e) => !!e.link_id)
  const viewEvents = events.filter((e) => !e.link_id)
  const within = (list: any[], d: number) =>
    list.filter((e) => now - new Date(e.created_at).getTime() < d * 86400000).length
  const taps30 = within(tapEvents, 30)
  const views30 = within(viewEvents, 30)
  // click-through rate is the number that says whether a page is working
  const ctr = views30 > 0 ? Math.round((taps30 / views30) * 100) : null
  const days: { label: string; n: number; v: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now - i * 86400000); start.setHours(0, 0, 0, 0)
    const end = start.getTime() + 86400000
    const inDay = (list: any[]) =>
      list.filter((e) => { const t = new Date(e.created_at).getTime(); return t >= start.getTime() && t < end }).length
    days.push({
      label: start.toLocaleDateString(undefined, { day: 'numeric' }),
      n: inDay(tapEvents),
      v: inDay(viewEvents),
    })
  }
  const peak = Math.max(1, ...days.map((d) => Math.max(d.n, d.v)))
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
  // headings and dividers are rows, not destinations: they never appear here
  const topLinks = links.filter((l) => l.kind === 'link').slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 8)

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="shell">
        <header className="topbar">
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</span>
          <a className="topurl" href={'/' + page.username} target="_blank" rel="noopener noreferrer"
            title="Open your live page in a new tab">
            relayme.bio/{page.username}<span className="topurlgo" aria-hidden="true">↗</span>
          </a>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span className="saved">Saved</span>}
            <button className="btn small"
              aria-current={tab === 'share' ? 'page' : undefined}
              onClick={() => setTab('share')}>Share</button>
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
            <button className="btn small ghost" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>Sign out</button>
          </div>
        </aside>

        <div className="work">
          <div className="deco" aria-hidden="true">
            {/* Trimmed from twenty-one to ten. The same feeling, half the
                animating DOM, and it only renders above 1320px anyway. */}
            <Bear size={54} style={{ top: 42, left: 58, transform: 'rotate(-9deg)' }} />
            <Squiggle color="#B0A0FF" size={58} style={{ top: 196, left: 74, transform: 'rotate(-6deg)' }} />
            <Rocket size={50} style={{ top: 292, left: 20, transform: 'rotate(18deg)' }} />
            <Star color="#F0A2FD" size={16} style={{ top: 402, left: 88, transform: 'rotate(-11deg)' }} />
            <Robot size={52} style={{ top: 470, left: 30, transform: 'rotate(-5deg)' }} />

            <Squiggle color="#C6F15C" size={56} style={{ top: 158, right: 14, transform: 'rotate(-10deg)' }} />
            <Star color="#F0A2FD" size={20} style={{ top: 236, right: 86, transform: 'rotate(16deg)' }} />
            <Bear size={48} style={{ top: 318, right: 26, transform: 'rotate(-7deg)' }} />
            <Rocket size={46} style={{ top: 432, right: 76, transform: 'rotate(13deg)' }} />
            <Star color="#C6F15C" size={18} style={{ top: 534, right: 20, transform: 'rotate(-18deg)' }} />
          </div>

          <section className="panel">
            {justUpgraded && <div className="banner">You are in. Everything is unlocked.</div>}

            {dirty && (
              <div className="trybar">
                <p><strong>You are trying out Pro.</strong> Nothing here is saved. Subscribe and these exact settings are applied to your page the moment you come back.</p>
                <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>Keep these — $49.99/yr</button>
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
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-60)' }}>{chars(bio).length}/200</p>
                </div>

                <div className="block block-mint">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Your links</h2>
                    <span className="counter">{linkCount} {linkCount === 1 ? 'link' : 'links'}</span>
                  </div>
                  <p className="bsub">Drag the handle to reorder, or use the arrows on a phone. Star makes it the big button. The eye hides it without deleting. Leave the title empty and we read it from the site.</p>

                  {/* Every panel opens directly beneath the row it belongs to. They
                      used to render after the whole list, so clicking the clock on the
                      second of seven rows opened something far below the fold with no
                      sign anything had happened. */}
                  {links.map((l, i) => (
                    <Fragment key={l.id}>
                    <div draggable={scheduleFor !== l.id && thumbFor !== l.id}
                      onDragStart={() => { dragFrom.current = i }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={() => onDrop(i)}
                      onDragEnd={() => { dragFrom.current = null; setDragOver(null) }}
                      className={(dragOver === i ? 'row rowover' : 'row')
                        + (l.is_active ? '' : ' hiddenrow')
                        + ((scheduleFor === l.id || thumbFor === l.id || confirmLink === l.id) ? ' rowopen' : '')}>
                      <span className="grip">⠿</span>
                      {l.kind === 'link' && (
                        <button className="thumbbtn" title={isPro ? 'Change this image' : 'Your own image is a Pro feature'}
                          aria-label={'Change the image for ' + l.title}
                          aria-expanded={thumbFor === l.id}
                          onClick={() => { setConfirmLink(null); setScheduleFor(null); isPro ? setThumbFor(thumbFor === l.id ? null : l.id) : setErr('Your own image on a link is a Pro feature.') }}>
                          {l.embed_kind && !l.image_url
                            ? <span className="fav kindmark" style={{
                                background: l.embed_kind === 'youtube' ? '#FF0000' : l.embed_kind === 'spotify' ? '#1DB954' : '#FF5500',
                                color: '#fff', fontSize: 11,
                              }} aria-hidden="true">▶</span>
                            : (l.image_url || l.favicon_url)
                              ? <img className="fav" src={(l.image_url || l.favicon_url) as string} alt="" />
                              : <span className="fav favblank" />}
                          <span className="thumbpen" aria-hidden="true">✎</span>
                        </button>
                      )}
                      {l.kind === 'heading' && <span className="fav kindmark" aria-hidden="true">H</span>}
                      {l.kind === 'divider' && <span className="fav kindmark" aria-hidden="true">—</span>}
                      <div className="rowtext">
                        <p className={l.kind === 'link' ? 'rowtitle' : 'rowtitle rowtitle-alt'}>
                          {l.kind === 'divider' ? 'Divider' : l.title}
                        </p>
                        <p className={
                          emptyGroup(i) || scheduleState(l) === 'ended'
                            ? 'rowmeta rowmeta-warn'
                            : (l.kind === 'link' && !l.embed_kind && isPro && detectEmbed(l.url) ? 'rowmeta rowmeta-hint' : 'rowmeta')
                        }>
                          {l.is_active ? '' : 'Hidden · '}
                          {l.kind === 'link'
                            ? [
                                l.embed_kind
                                  ? 'Plays here · ' + embedName(l.embed_kind as any)
                                  : (isPro && detectEmbed(l.url) ? 'Can play here — tap ▶' : ''),
                                scheduleState(l) === 'none' ? '' : scheduleLabel(l),
                                l.click_count + ' taps',
                              ].filter(Boolean).join(' · ')
                            : emptyGroup(i)
                              ? 'Nothing under it yet — move it above some links'
                              : l.kind === 'heading' ? 'Heading' : 'A line across the page'}
                        </p>
                      </div>
                      <div className="rowctl">
                      <div className="movecol">
                        <button className="icon move" title="Move up" aria-label={'Move ' + (l.title || 'divider') + ' up'}
                          disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                        <button className="icon move" title="Move down" aria-label={'Move ' + (l.title || 'divider') + ' down'}
                          disabled={i === links.length - 1} onClick={() => move(i, 1)}>▼</button>
                      </div>
                      <button className="icon eyebtn" title={l.is_active ? 'Hide from your page' : 'Show on your page'} onClick={() => toggleActive(l.id)}>{l.is_active ? '◉' : '○'}</button>
                      {l.kind === 'link' && detectEmbed(l.url) && (
                        <button className={l.embed_kind ? 'icon on' : 'icon'}
                          title={l.embed_kind ? 'Plays on your page — tap to make it a button again' : 'Play this on your page instead of sending people away'}
                          aria-label={'Play ' + l.title + ' inline'}
                          aria-pressed={!!l.embed_kind}
                          onClick={() => toggleEmbed(l.id)}>▶</button>
                      )}
                      {l.kind === 'link' && (
                        <button className={scheduleState(l) === 'none' ? 'icon' : 'icon on'}
                          title={isPro ? 'Give this link a start or an end' : 'Scheduling is a Pro feature'}
                          aria-label={'Schedule ' + l.title}
                          aria-expanded={scheduleFor === l.id}
                          onClick={() => { setConfirmLink(null); setThumbFor(null); isPro ? setScheduleFor(scheduleFor === l.id ? null : l.id) : setErr('Scheduling a link is a Pro feature.') }}>◷</button>
                      )}
                      {l.kind === 'link'
                        ? <button className={l.is_primary ? 'icon on' : 'icon'} title="Make this the main link" onClick={() => makePrimary(l.id)}>★</button>
                        : <span className="icon icondim" aria-hidden="true" />}
                      {l.kind === 'link' && (
                        <button className="icon" title="Read the title from the site again"
                          aria-label={'Refresh the title for ' + l.title}
                          disabled={titleBusy === l.id}
                          onClick={() => refetchTitle(l.id)}>{titleBusy === l.id ? '…' : '⟳'}</button>
                      )}
                      <button className="icon" title="Delete" aria-label={'Delete ' + (l.title || 'divider')}
                        onClick={() => { setScheduleFor(null); setThumbFor(null); setConfirmLink(confirmLink === l.id ? null : l.id) }}>✕</button>
                      </div>
                    </div>

                    {scheduleFor === l.id && (
                      <div className="rowpanel">
                        <p>
                          <strong>When should <em>{l.title}</em> be on your page?</strong> Leave
                          either side empty for no limit. Outside its window the link is simply not
                          there — no greyed-out button for a visitor to wonder about.
                        </p>
                        <div className="schedgrid">
                          <label className="label">
                            Starts
                            <input className="field" type="datetime-local" autoFocus value={toLocalInput(l.starts_at)}
                              onChange={(e) => setWindow(l.id, 'starts_at', e.target.value)} />
                          </label>
                          <label className="label">
                            Ends
                            <input className="field" type="datetime-local" value={toLocalInput(l.ends_at)}
                              onChange={(e) => setWindow(l.id, 'ends_at', e.target.value)} />
                          </label>
                        </div>
                        <p className="bsub" style={{ margin: '10px 0 0', fontSize: 13 }}>
                          Times are your own clock, and every change saves as you make it. Your page
                          is cached for a minute, so a link arrives or leaves within about a minute
                          of the time you set.
                        </p>
                        <div className="rowactions">
                          {scheduleState(l) !== 'none' && (
                            <button className="btn small ghost" onClick={() => clearWindow(l.id)}>Always on</button>
                          )}
                          <button className="btn small" onClick={() => setScheduleFor(null)}>Done</button>
                        </div>
                      </div>
                    )}

                    {thumbFor === l.id && (
                      <div className="rowpanel">
                        <p>
                          <strong>Your own image for this link.</strong> Square works best — we crop
                          to the middle and shrink it before it leaves your browser.
                        </p>
                        <div className="rowactions">
                          <label className="btn small">
                            {thumbBusy === l.id ? 'Uploading…' : 'Choose an image'}
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={(e) => {
                                const f = e.target.files && e.target.files[0]
                                if (f) uploadThumb(l.id, f)
                                e.target.value = ''
                              }} />
                          </label>
                          {l.image_url && (
                            <button className="btn small ghost" onClick={() => clearThumb(l.id)}>
                              Back to the site&rsquo;s own icon
                            </button>
                          )}
                          <button className="btn small" onClick={() => setThumbFor(null)}>Done</button>
                        </div>
                      </div>
                    )}

                    {confirmLink === l.id && (
                      <div className="rowpanel danger">
                        <p>
                          {l.kind === 'divider'
                            ? 'Delete this divider?'
                            : l.kind === 'heading'
                              ? <>Delete the heading <strong>{l.title}</strong>?</>
                              : <>Delete <strong>{l.title}</strong>? Its {l.click_count} taps go with it, and that cannot be undone.</>}
                        </p>
                        <div className="rowactions">
                          <button className="btn small dangerbtn" onClick={() => removeLink(l.id)}>Delete it</button>
                          <button className="btn small ghost" onClick={() => setConfirmLink(null)}>Keep it</button>
                        </div>
                      </div>
                    )}
                    </Fragment>
                  ))}

                  {links.length === 0 && <p className="bsub">Nothing to relay yet. Add your first link below.</p>}

                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--ink-12)' }}>
                    <div className="addtabs" role="tablist">
                      <button role="tab" aria-selected={addKind === 'link'}
                        className={addKind === 'link' ? 'addtab on' : 'addtab'}
                        onClick={() => { setAddKind('link'); setErr('') }}>Link</button>
                      <button role="tab" aria-selected={addKind === 'heading'}
                        className={addKind === 'heading' ? 'addtab on' : 'addtab'}
                        onClick={() => { setAddKind('heading'); setErr('') }}>Heading</button>
                    </div>

                    {addKind === 'link' ? (
                      <>
                        <input className="field" placeholder="https://..." value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !adding) addLink() }} />
                        <input className="field" style={{ marginTop: 10 }} placeholder="Title (optional)"
                          value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !adding) addLink() }} />
                        <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={addLink} disabled={adding}>
                          {adding ? 'Reading the site…' : 'Add link'}
                        </button>
                      </>
                    ) : (
                      <>
                        <input className="field" placeholder="Music, Shop, Listen…" value={headingText}
                          maxLength={40} onChange={(e) => setHeadingText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') addHeading() }} />
                        <p className="bsub" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
                          A heading names the links under it. A divider is just a line — useful when
                          the grouping is obvious and a word would be noise. New ones arrive at the
                          top of the list; walk it down with the arrows to where the group starts.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                          <button className="btn" style={{ flex: 1, minWidth: 150 }} onClick={addHeading}>Add heading</button>
                          <button className="btn ghost" style={{ flex: 1, minWidth: 150 }} onClick={addDivider}>Add a divider</button>
                        </div>
                      </>
                    )}
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
                      {socials.map((sc, i) => (
                        <div key={sc.id} className={socOver === i ? 'socpill rowover' : 'socpill'}
                          draggable={editSocial !== sc.id}
                          onDragStart={() => { socFrom.current = i }}
                          onDragOver={(e) => { e.preventDefault(); setSocOver(i) }}
                          onDragLeave={() => setSocOver(null)}
                          onDrop={() => onSocialDrop(i)}
                          onDragEnd={() => { socFrom.current = null; setSocOver(null) }}>
                          <span className="grip">⠿</span>
                          <SocialIcon id={sc.platform} color="currentColor" size={22} />
                          {editSocial === sc.id ? (
                            <>
                              <input className="field socedit" value={editSocialUrl} autoFocus
                                onChange={(e) => setEditSocialUrl(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveSocial(sc.id); if (e.key === 'Escape') setEditSocial(null) }} />
                              <button className="btn small" onClick={() => saveSocial(sc.id)}>Save</button>
                              <button className="icon" title="Cancel" onClick={() => setEditSocial(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <span className="soctext">{sc.url}</span>
                              <div className="movecol">
                                <button className="icon move" title="Move up" aria-label={'Move ' + socialName(sc.platform) + ' up'}
                                  disabled={i === 0} onClick={() => moveSocial(i, -1)}>▲</button>
                                <button className="icon move" title="Move down" aria-label={'Move ' + socialName(sc.platform) + ' down'}
                                  disabled={i === socials.length - 1} onClick={() => moveSocial(i, 1)}>▼</button>
                              </div>
                              <button className="icon" title="Edit" aria-label={'Edit ' + socialName(sc.platform)}
                                onClick={() => { setEditSocial(sc.id); setEditSocialUrl(sc.url) }}>✎</button>
                              <button className="icon" title="Remove" aria-label={'Remove ' + socialName(sc.platform)}
                                onClick={() => removeSocial(sc.id)}>✕</button>
                            </>
                          )}
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
                    <button className="btn" onClick={() => addSocial()}>Add</button>
                  </div>

                  {socSuggest && (
                    <div className="rowpanel" style={{ borderRadius: 18, borderTop: '1px solid var(--line)', marginTop: 12 }}>
                      <p>
                        <strong>That points at a {detectEmbed(socSuggest) && detectEmbed(socSuggest)!.kind === 'youtube' ? 'video' : 'track'}, not a profile.</strong>{' '}
                        An icon is a small button that sends people to another site. Added to your
                        links instead, it {isPro ? 'plays right on your page' : 'becomes a proper button with its own title and image'}.
                      </p>
                      <div className="rowactions">
                        <button className="btn small" onClick={socialToLink} disabled={adding}>
                          {adding ? 'Reading the site…' : 'Add it to my links'}
                        </button>
                        <button className="btn small ghost" onClick={() => addSocial(true)}>Add the icon anyway</button>
                        <button className="btn small ghost" onClick={() => setSocSuggest(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {socSuggest && (
                    <div className="rowpanel" style={{ borderRadius: 18, borderTop: '1px solid var(--line)', marginTop: 12 }}>
                      <p>
                        <strong>That is a {detectEmbed(socSuggest) ? embedName(detectEmbed(socSuggest)!.kind) : ''} link to
                        one thing, not to your profile.</strong> As an icon it will be a small circle that sends
                        people away. As a link it can sit in your list{isPro ? ' and play on the page itself' : ''}.
                      </p>
                      <div className="rowactions">
                        <button className="btn small" onClick={socialToLink} disabled={adding}>
                          {adding ? 'Adding…' : 'Add it as a link instead'}
                        </button>
                        <button className="btn small ghost" onClick={() => addSocial(true)}>Add the icon anyway</button>
                        <button className="btn small ghost" onClick={() => setSocSuggest(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'stats' && (
              <div>
                <div className="block block-violet">
                  <h2 className="bh">Views</h2>
                  <p className="bsub">People who opened your page. One visitor counts once an hour.</p>
                  <div className="statgrid">
                    <div className="stat"><p className="statnum">{totalViews}</p><p className="statlab">all time</p></div>
                    <div className="stat"><p className="statnum">{views30}</p><p className="statlab">last 30 days</p></div>
                    <div className="stat"><p className="statnum">{within(viewEvents, 7)}</p><p className="statlab">last 7 days</p></div>
                    <div className="stat"><p className="statnum">{within(viewEvents, 1)}</p><p className="statlab">today</p></div>
                  </div>
                </div>

                <div className="block block-mint">
                  <h2 className="bh">Taps</h2>
                  <p className="bsub">Every tap on every link, counted since your page went up.</p>
                  <div className="statgrid">
                    <div className="stat"><p className="statnum">{totalTaps}</p><p className="statlab">all time</p></div>
                    <div className="stat"><p className="statnum">{taps30}</p><p className="statlab">last 30 days</p></div>
                    <div className="stat"><p className="statnum">{within(tapEvents, 7)}</p><p className="statlab">last 7 days</p></div>
                    <div className="stat"><p className="statnum">{within(tapEvents, 1)}</p><p className="statlab">today</p></div>
                  </div>
                  {ctr !== null && (
                    <p className="bsub" style={{ margin: '16px 0 0' }}>
                      <strong>{ctr}% of visitors tapped something</strong> in the last thirty days.
                      {ctr < 20 ? ' Fewer links, or a clearer main one, usually lifts that.' : ' That is a page doing its job.'}
                    </p>
                  )}
                </div>

                <Countries pageId={page.id} isPro={isPro} />

                <div className="block block-plain">
                  <h2 className="bh">Last fourteen days</h2>
                  <p className="bsub">
                    <span className="key key-view" /> views
                    <span className="key key-tap" style={{ marginLeft: 14 }} /> taps
                  </p>
                  {!statsLoaded && <p className="bsub">Counting…</p>}
                  {statsLoaded && (
                    <div className="bars">
                      {days.map((d, i) => (
                        <div key={i} className="barcol" title={d.v + ' views, ' + d.n + ' taps'}>
                          <div className="bartrack">
                            <div className="barview" style={{ height: Math.round((d.v / peak) * 100) + '%' }} />
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
                  <p className="bsub">5 are free. Tap any Pro one to try it — the preview updates straight away, and nothing saves until you subscribe.</p>
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
                    <p className="bsub">47 themes, 8 fonts, your own colours, a background image, and no Relay badge. Try any of it now — you only pay to keep it.</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                      <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>{busy ? 'One moment…' : '$49.99 a year'}</button>
                      <button className="btn ghost" onClick={() => startCheckout('month')} disabled={busy}>$8 a month</button>
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

                  {(view.use_custom || view.custom_bg || view.custom_button_bg || view.custom_button_text || view.custom_accent_bg) && (
                    <div className="resetrow">
                      <button className="btn small ghost" onClick={resetColours}>
                        Reset to {theme ? theme.name : 'theme'} colours
                      </button>
                      <span>Puts all four back to the theme. Your links and photo are untouched.</span>
                    </div>
                  )}
                </div>

                <div className="block block-plain">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">The Relay badge</h2>
                    {!isPro && <span className="prodot">Pro</span>}
                  </div>
                  <p className="bsub">
                    A small &ldquo;Join {page.username} on Relay&rdquo; button sits at the foot of your public
                    page. Pro can turn it off. Free accounts can try it, Pro keeps it.
                  </p>
                  <label className="switch">
                    <input type="checkbox" checked={view.show_branding === false}
                      onChange={(e) => {
                        const f = { show_branding: !e.target.checked }
                        isPro ? patch(f) : preview(f)
                      }} />
                    <span>Hide the Relay badge on my page</span>
                  </label>
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
                    <p className="bsub">Fonts, colours, backgrounds and removing the Relay badge are part of Pro.</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                      <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>$49.99 a year</button>
                      <button className="btn ghost" onClick={() => startCheckout('month')} disabled={busy}>$8 a month</button>
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
                    <li><span>Plan</span><span>{isPro ? (sub && sub.price_interval === 'month' ? 'Pro, $8 a month + VAT' : 'Pro, $49.99 a year + VAT') : 'Free'}</span></li>
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
                  <h2 className="bh">Your page</h2>
                  <p className="bsub">
                    {page.is_published
                      ? 'Your page is live and can be found by anyone with the link, and by search engines.'
                      : 'Your page is hidden. The address returns a not-found page, it is out of our sitemap, and your links and stats are kept exactly as they are.'}
                  </p>
                  <button className={page.is_published ? 'btn ghost' : 'btn'} disabled={pubBusy}
                    onClick={() => setPublished(!page.is_published)}>
                    {pubBusy ? 'One moment…' : page.is_published ? 'Take my page offline' : 'Put my page back online'}
                  </button>
                  <p className="bsub" style={{ margin: '12px 0 0', fontSize: 13.5 }}>
                    Taking it offline is not the same as deleting it. Your username stays yours.
                  </p>
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
                        <button className="btn" onClick={() => startCheckout('year')} disabled={busy}>Go Pro — $49.99 a year</button>
                        <button className="btn ghost" onClick={() => startCheckout('month')} disabled={busy}>$8 a month</button>
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
                      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--ink-60)' }}>
                        We will email you a confirmation once it is done.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'audience' && (
              <>
                <div className={isPro ? 'block block-violet' : 'block block-plain'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Collect emails</h2>
                    {!isPro && <span className="prodot">Pro</span>}
                  </div>
                  <p className="bsub">
                    A card at the bottom of your page asking for an email address. The list is
                    yours: download it whenever you like and take it wherever you go.
                  </p>

                  <label className="switch">
                    <input type="checkbox" checked={!!view.capture_on}
                      onChange={(e) => (isPro ? patch({ capture_on: e.target.checked }) : preview({ capture_on: e.target.checked }))} />
                    <span>Show the card on my page</span>
                  </label>

                  {view.capture_on && (
                    <div style={{ marginTop: 16 }}>
                      <label className="label">Heading</label>
                      <input className="field" value={capHeading} maxLength={60} placeholder="Get my emails"
                        onChange={(e) => setCapHeading(e.target.value.slice(0, 60))} onBlur={saveCapture} />

                      <label className="label" style={{ marginTop: 12 }}>Button</label>
                      <input className="field" value={capButton} maxLength={30} placeholder="Sign me up"
                        onChange={(e) => setCapButton(e.target.value.slice(0, 30))} onBlur={saveCapture} />

                      <label className="label" style={{ marginTop: 12 }}>A line of your own (optional)</label>
                      <input className="field" value={capNote} maxLength={140} placeholder="One email a month, about the record."
                        onChange={(e) => setCapNote(e.target.value.slice(0, 140))} onBlur={saveCapture} />
                      <p className="bsub" style={{ margin: '10px 0 0', fontSize: 13 }}>
                        Whatever you write, the card also tells people their address goes to you
                        rather than to Relay, that we will check it is really them, and how to leave.
                        That part is not editable, because it is what makes asking lawful.
                      </p>
                    </div>
                  )}
                </div>

                <div className="block block-plain">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                    <h2 className="bh">Your list</h2>
                    <span className="counter">{confirmedSubs.length} confirmed</span>
                  </div>

                  {!subsLoaded && <p className="bsub">Fetching…</p>}

                  {subsLoaded && subs.length === 0 && (
                    <p className="bsub" style={{ marginBottom: 0 }}>
                      Nobody yet. Addresses appear here once the person has clicked the link we
                      email them.
                    </p>
                  )}

                  {subsLoaded && subs.length > 0 && (
                    <>
                      {pendingSubs.length > 0 && (
                        <p className="bsub">
                          {pendingSubs.length} {pendingSubs.length === 1 ? 'address has' : 'addresses have'} not
                          confirmed yet. They are not on your list and are not in the download.
                        </p>
                      )}

                      <div className="sublist">
                        {subs.slice(0, 50).map((x) => (
                          <div key={x.id} className="subrow">
                            <span className="submail">{x.email}</span>
                            <span className={x.confirmed_at ? 'subtag ok' : 'subtag'}>
                              {x.confirmed_at ? 'Confirmed' : 'Waiting'}
                            </span>
                            <button className="icon" title="Remove" aria-label={'Remove ' + x.email}
                              onClick={() => removeSub(x.id)}>✕</button>
                          </div>
                        ))}
                      </div>
                      {subs.length > 50 && (
                        <p className="bsub" style={{ marginTop: 12 }}>
                          Showing the 50 most recent. The download has all of them.
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        <button className="btn" onClick={downloadList} disabled={confirmedSubs.length === 0}>
                          Download as CSV
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="block block-plain">
                  <h2 className="bh">What you are agreeing to</h2>
                  <p className="bsub" style={{ marginBottom: 0 }}>
                    These are other people&rsquo;s addresses, so the law treats you as responsible
                    for them, not us. Email only what they signed up for, put a way out in every
                    message, and delete anyone who asks. If you would rather not carry that, leave
                    the card switched off &mdash; the rest of your page works exactly the same.
                  </p>
                </div>
              </>
            )}

            {tab === 'share' && (
              <div className="block block-violet">
                <h2 className="bh">Your link</h2>
                <p className="biglink">relayme.bio/{page.username}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={copyUrl}>{copied ? 'Copied' : 'Copy link'}</button>
                  <a className="btn ghost" href={'/' + page.username} target="_blank" rel="noopener">Open page</a>
                  <button className="btn ghost" onClick={makeQr}>Make a QR code</button>
                  <a className="btn ghost" href={'/api/story?u=' + page.username}
                     download={page.username + '-relay-story.png'} target="_blank" rel="noopener">
                    Make a story image
                  </a>
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

            {tab === 'share' && (
              <div className="block block-plain">
                <h2 className="bh">How your page looks in search</h2>
                <p className="bsub">
                  Leave these empty and we use your name and bio. Fill them in when you want
                  Google and the share card to say something different from the page itself.
                </p>

                <label className="label">Search title</label>
                <input className="field" value={seoTitle} maxLength={70} placeholder={page.display_name || page.username}
                  onChange={(e) => setSeoTitle(e.target.value.slice(0, 70))} onBlur={saveSeo} />
                <p className="counter" style={{ margin: '6px 0 0' }}>{seoTitle.length}/70</p>

                <label className="label" style={{ marginTop: 14 }}>Search description</label>
                <textarea className="field" rows={2} value={seoDesc} maxLength={170}
                  placeholder={page.bio || ('Links from ' + (page.display_name || page.username))}
                  onChange={(e) => setSeoDesc(e.target.value.slice(0, 170))} onBlur={saveSeo} />
                <p className="counter" style={{ margin: '6px 0 0' }}>{seoDesc.length}/170</p>

                <div className="serp">
                  <p className="serpurl">relayme.bio/{page.username}</p>
                  <p className="serptitle">{(seoTitle || page.display_name || page.username) + ' — Relay'}</p>
                  <p className="serpdesc">{seoDesc || page.bio || ('Links from ' + (page.display_name || page.username))}</p>
                </div>
              </div>
            )}

            {err && <p className="err">{err}</p>}
          </section>

          <aside className="preview">
            <Star color="#C6F15C" size={28} style={{ position: 'absolute', top: 30, right: 8 }} />
            <Star color="#F0A2FD" size={18} style={{ position: 'absolute', top: 250, left: 0 }} />
            <Star color="#B0A0FF" size={22} style={{ position: 'absolute', bottom: 60, right: 14 }} />
            <div className="previewinner">
              <Phone page={view} links={links} theme={theme} showBrand={view.show_branding !== false} socials={socials} />
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
