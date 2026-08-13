import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function POST(req: NextRequest) {
  let target = ''
  try {
    const body = await req.json()
    target = String(body.url || '')
  } catch (e) {}

  if (!/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: 'bad url' }, { status: 400 })
  }

  let host = ''
  try {
    const u = new URL(target)
    host = u.hostname
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(host)) {
      return NextResponse.json({ error: 'blocked' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'bad url' }, { status: 400 })
  }

  const fallbackIcon = 'https://www.google.com/s2/favicons?sz=128&domain=' + host

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 6000)
    const res = await fetch(target, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'RelayBot/1.0 (+https://relayme.bio)' },
    })
    clearTimeout(timer)

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
      try { icon = new URL(icon, res.url || target).toString() } catch (e) { icon = '' }
    }
    if (!icon) icon = fallbackIcon

    return NextResponse.json({ title, favicon: icon })
  } catch (e) {
    return NextResponse.json({ title: host, favicon: fallbackIcon })
  }
}
