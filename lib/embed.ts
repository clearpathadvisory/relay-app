// Which links can play where they are, and what to load when someone asks.
//
// Nothing here reaches a third party on its own. The public page draws a poster
// from this data and only loads the frame after a visitor clicks it, so a page
// that has never been interacted with still makes no request to YouTube,
// Spotify or SoundCloud. That is the whole reason the detection lives in a pure
// function rather than in the component.
export type EmbedKind = 'youtube' | 'spotify' | 'soundcloud'

export type Embed = { kind: EmbedKind; src: string; height: number }

function host(u: URL) {
  return u.hostname.replace(/^www\./, '').toLowerCase()
}

function youtubeId(u: URL): string | null {
  const h = host(u)
  if (h === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
  if (h !== 'youtube.com' && h !== 'm.youtube.com' && h !== 'music.youtube.com') return null
  if (u.pathname === '/watch') return u.searchParams.get('v')
  const parts = u.pathname.split('/').filter(Boolean)
  if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') return parts[1] || null
  return null
}

// Detects only; it never decides whether the account is allowed to use it.
export function detectEmbed(raw: string | null): Embed | null {
  if (!raw) return null
  let u: URL
  try { u = new URL(raw) } catch (e) { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null

  const h = host(u)

  const yt = youtubeId(u)
  if (yt && /^[A-Za-z0-9_-]{6,20}$/.test(yt)) {
    // nocookie, so the frame sets nothing until it is actually played
    return { kind: 'youtube', src: 'https://www.youtube-nocookie.com/embed/' + yt, height: 200 }
  }

  if (h === 'open.spotify.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    // an /intl-de/ prefix appears on localised links
    const at = parts[0] && parts[0].indexOf('intl-') === 0 ? 1 : 0
    const type = parts[at]
    const id = parts[at + 1]
    const allowed = ['track', 'album', 'playlist', 'episode', 'show', 'artist']
    if (type && id && allowed.indexOf(type) >= 0 && /^[A-Za-z0-9]{10,40}$/.test(id)) {
      return {
        kind: 'spotify',
        src: 'https://open.spotify.com/embed/' + type + '/' + id,
        height: type === 'track' || type === 'episode' ? 152 : 352,
      }
    }
  }

  if (h === 'soundcloud.com' && u.pathname.split('/').filter(Boolean).length >= 2) {
    return {
      kind: 'soundcloud',
      src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u.toString()) + '&color=%237C5CE6',
      height: 166,
    }
  }

  return null
}

export function embedName(kind: EmbedKind): string {
  if (kind === 'youtube') return 'YouTube'
  if (kind === 'spotify') return 'Spotify'
  return 'SoundCloud'
}

// The endpoint each service publishes for exactly this: give it a url, get the
// real title back. Scraping YouTube or Spotify for a title does not work —
// they render the page in the browser and hand a bot the site name at best.
export function oembedUrl(raw: string): string | null {
  const e = detectEmbed(raw)
  if (!e) return null
  const target = encodeURIComponent(raw)
  if (e.kind === 'youtube') return 'https://www.youtube.com/oembed?format=json&url=' + target
  if (e.kind === 'spotify') return 'https://open.spotify.com/oembed?url=' + target
  return 'https://soundcloud.com/oembed?format=json&url=' + target
}

// Sites append their own name to a title. "Never Gonna Give You Up - YouTube"
// is the page's title; the useful part is everything before the tail.
export function tidyTitle(title: string, host: string): string {
  let t = (title || '').trim()
  const tails = [
    / [-|–—] YouTube$/i, / on Spotify$/i, / \| Spotify$/i,
    / by .+ \| Free Listening on SoundCloud$/i, / \| SoundCloud$/i,
    / [-|–—] Apple Music$/i,
  ]
  for (const re of tails) t = t.replace(re, '')
  t = t.trim()
  // A title that is only the site's own name is no better than the address.
  // Compare against every label, not just the first: open.spotify.com starts
  // with "open", and the name being matched is "spotify".
  const bare = t.toLowerCase().replace(/[^a-z0-9]/g, '')
  const labels = host.toLowerCase().split('.').map((x) => x.replace(/[^a-z0-9]/g, ''))
  if (bare && labels.indexOf(bare) >= 0) return ''
  return t
}
