import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { lookup } from 'dns/promises'
import { isPrivateAddress } from '../../../lib/net'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Twenty lookups a minute is far more than adding links needs, and far less
// than anyone could use this for. Per instance, which is enough given the
// route now requires a signed-in account.
const RATE: Map<string, number[]> = (globalThis as any).__relayLinkmetaRate || new Map()
;(globalThis as any).__relayLinkmetaRate = RATE

function overLimit(key: string) {
  const now = Date.now()
  const hits = (RATE.get(key) || []).filter((t) => now - t < 60000)
  hits.push(now)
  RATE.set(key, hits)
  if (RATE.size > 5000) RATE.clear()
  return hits.length > 20
}

function pick(html: string, patterns: RegExp[]) {
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1]) return m[1].trim()
  }
  return ''
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
}

// Every hop is checked, not just the one the caller typed. A public hostname
// that 302s to an internal address is the standard way past a naive check.
async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL
  try { u = new URL(raw) } catch (e) { return null }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  if (u.port && u.port !== '80' && u.port !== '443') return null

  let addrs: { address: string }[]
  try {
    addrs = await lookup(u.hostname, { all: true })
  } catch (e) {
    return null
  }
  if (!addrs.length) return null
  // resolving to a private address anywhere is disqualifying
  for (const a of addrs) if (isPrivateAddress(a.address)) return null
  return u
}

export async function POST(req: NextRequest) {
  // Anyone could previously use this as a free URL fetcher with our servers'
  // address on the request. It now belongs to the account adding the link.
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhwxxobzeqiypgeazdub.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data: userRes, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !userRes.user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  if (overLimit(userRes.user.id)) {
    return NextResponse.json({ error: 'Too many lookups. Wait a moment.' }, { status: 429 })
  }

  let target = ''
  try {
    const body = await req.json()
    target = String(body.url || '').slice(0, 2000)
  } catch (e) {}

  let u = await safeUrl(target)
  if (!u) return NextResponse.json({ error: 'bad url' }, { status: 400 })

  const host = u.hostname
  const fallbackIcon = 'https://www.google.com/s2/favicons?sz=128&domain=' + host

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)

    let res: Response | null = null
    let current = u
    // follow redirects by hand so each destination can be validated
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(current.toString(), {
        signal: ctrl.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'RelayBot/1.0 (+https://relayme.bio)' },
      })
      if (res.status < 300 || res.status > 399) break
      const next = res.headers.get('location')
      if (!next) break
      const checked = await safeUrl(new URL(next, current).toString())
      if (!checked) { clearTimeout(timer); return NextResponse.json({ title: host, favicon: fallbackIcon }) }
      current = checked
      res = null
    }
    clearTimeout(timer)

    if (!res) return NextResponse.json({ title: host, favicon: fallbackIcon })

    const type = res.headers.get('content-type') || ''
    if (!res.ok || type.indexOf('text/html') < 0) {
      return NextResponse.json({ title: host, favicon: fallbackIcon })
    }

    const buf = await res.arrayBuffer()
    const html = new TextDecoder('utf-8').decode(buf.slice(0, 220000))

    let title = pick(html, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ])
    title = decode(title).slice(0, 58).trim() || host

    let icon = pick(html, [
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ])

    if (icon) {
      try {
        const abs = new URL(icon, res.url || current.toString())
        icon = abs.protocol === 'https:' || abs.protocol === 'http:' ? abs.toString() : ''
      } catch (e) { icon = '' }
    }
    if (!icon) icon = fallbackIcon

    return NextResponse.json({ title, favicon: icon })
  } catch (e) {
    return NextResponse.json({ title: host, favicon: fallbackIcon })
  }
}
