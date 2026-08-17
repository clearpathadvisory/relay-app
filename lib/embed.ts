// Which links can play where they are, and what to load when someone asks.
//
// Nothing here reaches a third party on its own. The public page draws a poster
// from this data and only loads the frame after a visitor clicks it, so a page
// that has never been interacted with still makes no request to YouTube,
// Spotify or SoundCloud. That is the whole reason the detection lives in a pure
// function rather than in the component.
export type EmbedKind = 'youtube' | 'spotify' | 'soundcloud' | 'applemusic' | 'bandcamp'

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

  // Apple Music publishes its player on a parallel host with the same path, so
  // the whole transform is a hostname swap. The query string carries with it:
  // ?i=<id> is what distinguishes one song inside an album from the album, and
  // dropping it would quietly play the wrong thing.
  if (h === 'music.apple.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    // /<storefront>/<type>/<slug>/<id>
    const store = parts[0]
    const type = parts[1]
    const allowed = ['album', 'playlist', 'song', 'artist', 'music-video']
    const id = parts[3]
    const idOk = !!id && (/^\d{3,}$/.test(id) || /^pl\.[A-Za-z0-9-]{4,}$/.test(id))
    if (store && /^[a-z]{2}$/.test(store) && type && allowed.indexOf(type) >= 0 && idOk) {
      const single = type === 'song' || type === 'music-video' || !!u.searchParams.get('i')
      return {
        kind: 'applemusic',
        src: 'https://embed.music.apple.com' + u.pathname + u.search,
        // Apple's own guidance: 175 for a single track, 450 for a list. An
        // album at 175 shows one row and hides the rest behind a scrollbar.
        height: single ? 175 : 450,
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
  if (kind === 'applemusic') return 'Apple Music'
  if (kind === 'bandcamp') return 'Bandcamp'
  return 'SoundCloud'
}

/**
 * Is this a Bandcamp release?
 *
 * Bandcamp is the one service here whose player cannot be worked out from the
 * address. The public URL is artist.bandcamp.com/album/some-record; the player
 * needs bandcamp.com/EmbeddedPlayer/album=1234567890, and that number lives
 * only in the page's own og:video tag. So this answers "worth looking up",
 * and the lookup happens once when the link is added.
 */
export function isBandcamp(raw: string | null): boolean {
  if (!raw) return false
  let u: URL
  try { u = new URL(raw) } catch (e) { return false }
  if (u.protocol !== 'https:') return false
  const h = host(u)
  if (h !== 'bandcamp.com' && !/\.bandcamp\.com$/.test(h)) return false
  const first = u.pathname.split('/').filter(Boolean)[0]
  return first === 'album' || first === 'track'
}

/**
 * Pull the player out of a Bandcamp page.
 *
 * og:video carries the whole EmbeddedPlayer URL already built, which is more
 * reliable than assembling one from an id scraped elsewhere — the tag is what
 * Bandcamp itself hands to Facebook.
 *
 * The result is rewritten to the look the rest of the page uses rather than
 * kept verbatim: Bandcamp's default player is a large dark artwork block, and
 * a page of neat rows does not want one of those dropped into the middle.
 */
export function bandcampPlayer(html: string): { src: string; height: number } | null {
  const m = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i)
     || html.match(/<meta[^>]+property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["']/i)
  if (!m) return null

  let u: URL
  try { u = new URL(m[1].replace(/&amp;/g, '&')) } catch (e) { return null }
  if (u.protocol !== 'https:' || host(u) !== 'bandcamp.com') return null
  if (u.pathname.indexOf('/EmbeddedPlayer') !== 0) return null

  // Bandcamp encodes options as path segments, not query parameters.
  const seg = u.pathname.split('/').filter(Boolean)
  const id = seg.find((x) => /^album=\d+$/.test(x) || /^track=\d+$/.test(x))
  if (!id) return null

  const track = id.indexOf('track=') === 0
  const opts = [
    'EmbeddedPlayer', id,
    'size=large', 'bgcol=ffffff', 'linkcol=7756e2',
    'artwork=small',
    'tracklist=' + (track ? 'false' : 'true'),
    'transparent=true',
  ]
  return {
    src: 'https://bandcamp.com/' + opts.join('/') + '/',
    // Bandcamp's own published heights for size=large with small artwork.
    // A track is a single row; an album adds its tracklist underneath.
    height: track ? 120 : 470,
  }
}

/** A player that was resolved once and stored, rather than derived just now. */
export function storedEmbed(src: string | null, height: number | null): Embed | null {
  if (!src) return null
  try {
    const u = new URL(src)
    if (u.protocol !== 'https:' || host(u) !== 'bandcamp.com') return null
  } catch (e) { return null }
  return { kind: 'bandcamp', src, height: height && height > 40 ? height : 470 }
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
  // Apple publishes no oEmbed endpoint. Returning null sends the lookup down
  // the ordinary HTML path, which reads og:title — and tidyTitle already
  // strips the "- Apple Music" tail from it.
  if (e.kind === 'applemusic') return null
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
