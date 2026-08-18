// Which links can play where they are, and what to load when someone asks.
//
// Nothing here reaches a third party on its own. The public page draws a poster
// from this data and only loads the frame after a visitor clicks it, so a page
// that has never been interacted with still makes no request to YouTube,
// Spotify, SoundCloud or anywhere else. That is the whole reason the detection
// lives in a pure function rather than in the component.
export type EmbedKind =
  | 'youtube' | 'spotify' | 'soundcloud' | 'applemusic' | 'bandcamp'
  | 'tidal' | 'deezer' | 'mixcloud' | 'audiomack'
  | 'calcom' | 'calendly'

// The dot each service wears on its play row. Kept beside the detection rather
// than in a component, because three surfaces draw it — the public card, the
// dashboard row and the preview — and three copies of a colour drift.
const MARK_BG: Record<EmbedKind, string> = {
  youtube: '#FF0000',
  spotify: '#1DB954',
  soundcloud: '#FF5500',
  applemusic: '#FA2D48',
  bandcamp: '#1DA0C3',
  tidal: '#000000',
  deezer: '#A238FF',
  mixcloud: '#5000FF',
  audiomack: '#FFA200',
  calcom: '#1A1A1A',
  calendly: '#006BFF',
}

// Booking is deliberately outside the Pro wall. Every other inline player is a
// Pro feature, but a freelancer choosing a link-in-bio picks the one that lets
// people book a call — gating it would gate the reason they arrive. The Pro
// upsell stays where it is: stickers, animated avatar, scheduled links, email.
const FREE_EMBEDS = ['calcom', 'calendly']

export function isFreeEmbed(kind: string | null): boolean {
  return !!kind && FREE_EMBEDS.indexOf(kind) >= 0
}

export function embedColor(kind: string | null): string {
  return (kind && MARK_BG[kind as EmbedKind]) || '#FF5500'
}

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

  // Tidal, like Apple Music, publishes a parallel embed host — but it also
  // renames the type on the way: /track/123 becomes /tracks/123. Playlists are
  // a uuid rather than a number, which is why the id test is not one regex.
  if (h === 'tidal.com' || h === 'listen.tidal.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    // /browse/ is what the web player puts in front of a shared address
    const at = parts[0] === 'browse' ? 1 : 0
    const type = parts[at]
    const id = parts[at + 1]
    const seg: Record<string, string> = {
      track: 'tracks', album: 'albums', playlist: 'playlists', video: 'videos', mix: 'mix',
    }
    const numeric = /^\d{3,}$/.test(id || '')
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '')
    const idOk = type === 'playlist' ? uuid : type === 'mix' ? /^[A-Za-z0-9]{6,40}$/.test(id || '') : numeric
    if (type && seg[type] && idOk) {
      const single = type === 'track'
      return {
        kind: 'tidal',
        src: 'https://embed.tidal.com/' + seg[type] + '/' + id,
        // A track is one row; a video wants picture; a list needs its rows.
        height: single ? 128 : type === 'video' ? 280 : 400,
      }
    }
  }

  // Deezer's addresses carry an optional storefront segment — /us/track/123 and
  // /track/123 are the same thing — and the widget wants only the tail of it.
  if (h === 'deezer.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    const at = parts[0] && /^[a-z]{2}$/.test(parts[0]) ? 1 : 0
    const type = parts[at]
    const id = parts[at + 1]
    const allowed = ['track', 'album', 'playlist', 'artist', 'show', 'episode']
    if (type && id && allowed.indexOf(type) >= 0 && /^\d{3,}$/.test(id)) {
      const single = type === 'track' || type === 'episode'
      return {
        kind: 'deezer',
        // light, because every theme this sits inside draws its own ground and
        // Deezer's dark widget punches a black rectangle through a pale card
        src: 'https://widget.deezer.com/widget/light/' + type + '/' + id + '?tracklist=true&radius=true',
        height: single ? 180 : 400,
      }
    }
  }

  // Mixcloud takes the show's own address as a parameter rather than an id, so
  // the transform is an encode rather than a lookup. The trailing slash is not
  // decoration — the widget returns an empty player without it.
  if (h === 'mixcloud.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length >= 2 && parts[0] !== 'widget' && parts[0] !== 'discover') {
      const list = parts[1] === 'playlists'
      const feed = '/' + parts.slice(0, list ? 3 : 2).join('/') + '/'
      if (!list || parts.length >= 3) {
        return {
          kind: 'mixcloud',
          src: 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=' + encodeURIComponent(feed),
          height: list ? 400 : 120,
        }
      }
    }
  }

  // Audiomack keeps the same three pieces and reorders them: the public
  // /artist/song/slug becomes /embed/song/artist/slug. Older links put the type
  // first, and both shapes are still handed out, so both are read.
  if (h === 'audiomack.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    const types = ['song', 'album', 'playlist']
    let type = ''
    let artist = ''
    let slug = ''
    if (parts.length >= 3 && types.indexOf(parts[1]) >= 0) {
      artist = parts[0]; type = parts[1]; slug = parts[2]
    } else if (parts.length >= 3 && types.indexOf(parts[0]) >= 0) {
      type = parts[0]; artist = parts[1]; slug = parts[2]
    }
    const ok = /^[A-Za-z0-9._-]{1,80}$/
    if (type && ok.test(artist) && ok.test(slug)) {
      return {
        kind: 'audiomack',
        src: 'https://audiomack.com/embed/' + type + '/' + artist + '/' + slug,
        height: type === 'song' ? 252 : 400,
      }
    }
  }

  // Booking. Both of these frame happily — Calendly answers with
  // X-Frame-Options: ALLOWALL and cal.com sends no frame restriction at all —
  // which is worth stating because an embed that refuses to frame fails silently
  // with a blank rectangle and nothing in the console.
  //
  // Unlike the music services there is no id to extract: the page IS the
  // booking, so the address passes through nearly unchanged.
  if (h === 'cal.com' || h === 'app.cal.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    // /user, /user/event, or /team/slug/event
    const reserved = ['auth', 'api', 'signup', 'login', 'embed', 'docs', 'pricing', 'apps', 'event-types']
    if (parts.length >= 1 && parts.length <= 3 && reserved.indexOf(parts[0]) < 0
        && /^[A-Za-z0-9._-]{1,60}$/.test(parts[0])) {
      const path = parts.join('/')
      return {
        kind: 'calcom',
        // month_view is the layout that fits a narrow column; the default
        // switches to a wide two-pane view and gets cut off in a 520px card.
        src: 'https://cal.com/' + path + '?embed=true&layout=month_view',
        height: 640,
      }
    }
  }

  if (h === 'calendly.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    const reserved = ['app', 'api', 'event_types', 'pages', 'signup', 'login']
    if (parts.length >= 1 && parts.length <= 3 && reserved.indexOf(parts[0]) < 0
        && /^[A-Za-z0-9._-]{1,60}$/.test(parts[0])) {
      return {
        kind: 'calendly',
        src: 'https://calendly.com/' + parts.join('/')
             + '?hide_gdpr_banner=1&hide_landing_page_details=1&background_color=ffffff',
        height: 660,
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
  if (kind === 'tidal') return 'TIDAL'
  if (kind === 'deezer') return 'Deezer'
  if (kind === 'mixcloud') return 'Mixcloud'
  if (kind === 'audiomack') return 'Audiomack'
  if (kind === 'calcom') return 'Cal.com'
  if (kind === 'calendly') return 'Calendly'
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

/**
 * The share sheets hand out a short link, not an address.
 *
 * `link.deezer.com/s/349b5o…` and `spotify.link/hRkBrwub9xb` carry no id at all,
 * so detectEmbed() has nothing to read and the link lands as an ordinary button.
 * That is what happened to the first Deezer link added after the nine-service
 * deploy — the code was right and the address was the wrong shape.
 *
 * These are also not ordinary redirects. Spotify's short links resolve in the
 * browser with JavaScript rather than a 301, and Deezer's are Firebase dynamic
 * links, which answer a bot with a real page whose head points at the track.
 * Following the hops is therefore not enough on its own; the page has to be read.
 */
const SHORT_HOSTS = [
  'link.deezer.com', 'deezer.page.link', 'dzr.page.link',
  'spotify.link', 'link.tospotify.com',
  'on.soundcloud.com',
  'tidal.link', 'listen.tidal.link',
]

export function isShortLink(raw: string | null): boolean {
  if (!raw) return false
  let u: URL
  try { u = new URL(raw) } catch (e) { return false }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  return SHORT_HOSTS.indexOf(host(u)) >= 0
}

/**
 * Find the real address inside a short link's page.
 *
 * Deliberately narrow. It runs only for the hosts above, and it accepts a
 * candidate only if detectEmbed() already recognises it — so the worst a hostile
 * page on one of those hosts can do is point at a service we would have embedded
 * anyway. It cannot be steered at an arbitrary origin, because an arbitrary
 * origin is not something detectEmbed returns a player for.
 *
 * og:url and the canonical link come first because they are the page's own
 * statement of what it is. The sweep afterwards is for the Firebase pages, which
 * keep the destination in a script rather than the head.
 */
export function resolveShortLink(html: string): string | null {
  const candidates: string[] = []

  const head = [
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:app:url:iphone["'][^>]+content=["']([^"']+)["']/i,
  ]
  for (const re of head) {
    const m = html.match(re)
    if (m && m[1]) candidates.push(m[1])
  }

  // Everything that looks like an address on a service we can play. Capped, so
  // a very large page cannot turn this into a long scan.
  // A Firebase page keeps the destination inside a script, as JSON, where every
  // slash is escaped. A plain sweep finds nothing there, so the escapes are
  // undone first. This copy is only ever read for candidates.
  const flat = html
    .replace(/\\u002F/gi, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/\\\//g, '/')

  // Everything that looks like an address on a service we can play. Capped, so
  // a very large page cannot turn this into a long scan.
  const sweep = flat.match(/https:\/\/[A-Za-z0-9.\-]+\/[^"'<>\s\\]{1,200}/g) || []
  for (const raw of sweep.slice(0, 400)) candidates.push(raw)

  for (const raw of candidates) {
    const cleaned = raw.replace(/&amp;/g, '&').replace(/[.,)]+$/, '')
    // A short link naming another short link is a loop, not an answer.
    if (isShortLink(cleaned)) continue
    if (detectEmbed(cleaned)) return cleaned
  }
  return null
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
  if (e.kind === 'soundcloud') return 'https://soundcloud.com/oembed?format=json&url=' + target
  // Apple publishes no oEmbed endpoint, and neither do TIDAL, Deezer, Mixcloud
  // or Audiomack in a form worth depending on. Returning null sends the lookup
  // down the ordinary HTML path, which reads og:title — and tidyTitle already
  // strips each site's tail from it.
  //
  // This used to end in a bare `return soundcloud`, so any kind added later
  // would have quietly asked SoundCloud to describe a Deezer address.
  return null
}

// Sites append their own name to a title. "Never Gonna Give You Up - YouTube"
// is the page's title; the useful part is everything before the tail.
export function tidyTitle(title: string, host: string): string {
  let t = (title || '').trim()
  const tails = [
    / [-|–—] YouTube$/i, / on Spotify$/i, / \| Spotify$/i,
    / by .+ \| Free Listening on SoundCloud$/i, / \| SoundCloud$/i,
    / [-|–—] Apple Music$/i,
    / on TIDAL$/i, / [-|–—] TIDAL$/i, / \| TIDAL$/i,
    / [-|–—] (?:song and lyrics )?(?:by .+ \| )?Deezer$/i, / \| Deezer$/i,
    / by .+ \| Mixcloud$/i, / \| Mixcloud$/i, / [-|–—] Mixcloud$/i,
    / by .+ \| Audiomack$/i, / \| Audiomack$/i, / [-|–—] Audiomack$/i,
    / \| Cal\.com$/i, / [-|–—] Cal\.com$/i, / [-|–—] Calendly$/i, / \| Calendly$/i,
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
