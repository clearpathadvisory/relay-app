'use client'

import { useEffect, useState } from 'react'
import { Link } from '../../lib/supabase'
import { detectEmbed, storedEmbed, embedName, embedColor, EmbedKind } from '../../lib/embed'

// Only one thing plays at a time. Each card announces when it opens and every
// other card closes itself, which unmounts the frame and stops the sound —
// there is no way to reach into a third-party iframe and pause it, so removing
// it is the only reliable stop.
const OPENED = 'relay:embed-opened'

// Each service's own mark, in its own colour, drawn here rather than fetched.
// The favicon a site hands back is often a generic play square, which tells a
// visitor nothing about where the thing will come from.
function ServiceMark({ kind }: { kind: EmbedKind }) {
  if (kind === 'youtube') {
    return (
      <span className="embedmark" style={{ background: '#FF0000' }}>
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path d="M9.2 8.4 L16.4 12 L9.2 15.6 Z" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'bandcamp') {
    return (
      <span className="embedmark" style={{ background: '#1DA0C3' }}>
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path d="M9.6 6.4h9.2l-4.4 11.2H5.2Z" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'applemusic') {
    return (
      <span className="embedmark" style={{ background: '#FA2D48' }}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M16.5 5.4 9.4 7v7.6" fill="none" stroke="#FFFFFF" strokeWidth="1.9"
                strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7.6" cy="15.3" r="2.2" fill="#FFFFFF" />
          <circle cx="14.7" cy="13.7" r="2.2" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'calcom' || kind === 'calendly') {
    return (
      <span className="embedmark" style={{ background: embedColor(kind) }}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="4.5" y="6" width="15" height="13" rx="2.6" fill="none"
                stroke="#FFFFFF" strokeWidth="1.9" />
          <path d="M4.5 10h15" stroke="#FFFFFF" strokeWidth="1.9" />
          <path d="M8.6 4.6v2.8M15.4 4.6v2.8" stroke="#FFFFFF" strokeWidth="1.9"
                strokeLinecap="round" />
          <circle cx="12" cy="14.4" r="1.7" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'tidal') {
    return (
      <span className="embedmark" style={{ background: embedColor(kind) }}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 5.6 14.5 8.1 12 10.6 9.5 8.1Z" fill="#FFFFFF" />
          <path d="M12 13.4 14.5 15.9 12 18.4 9.5 15.9Z" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'deezer') {
    return (
      <span className="embedmark" style={{ background: embedColor(kind) }}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="6" y="7.6" width="12" height="2.3" rx="1.15" fill="#FFFFFF" />
          <rect x="6" y="11.4" width="12" height="2.3" rx="1.15" fill="#FFFFFF" />
          <rect x="6" y="15.2" width="12" height="2.3" rx="1.15" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'mixcloud') {
    return (
      <span className="embedmark" style={{ background: embedColor(kind) }}>
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path d="M8.4 16h7.9a2.9 2.9 0 0 0 .2-5.8 4.4 4.4 0 0 0-8.4-1A3.4 3.4 0 0 0 8.4 16Z" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'audiomack') {
    return (
      <span className="embedmark" style={{ background: embedColor(kind) }}>
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <circle cx="12" cy="12" r="6" fill="none" stroke="#FFFFFF" strokeWidth="1.9" />
          <path d="M10.6 9.5 14.5 12 10.6 14.5Z" fill="#FFFFFF" />
        </svg>
      </span>
    )
  }
  if (kind === 'spotify') {
    return (
      <span className="embedmark" style={{ background: '#1DB954' }}>
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path
            d="M6.9 9.2c3.3-1 6.8-.6 9.9 1 M7.6 12.3c2.7-.8 5.5-.4 8 1 M8.3 15.2c2.1-.6 4.2-.3 6.1.8"
            fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round"
          />
        </svg>
      </span>
    )
  }
  return (
    <span className="embedmark" style={{ background: '#FF5500' }}>
      <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
        <path
          d="M5 14.5v-3 M8 15.5v-5 M11 16v-7 M14 16v-8.5"
          fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round"
        />
        <path d="M16.5 16h1.9a2.6 2.6 0 0 0 0-5.2c-.2 0-.5 0-.7.1" fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </span>
  )
}

// Click to load, deliberately. A page nobody has interacted with makes no
// request to YouTube, Spotify, TIDAL or anywhere else at all — the poster is drawn from
// the page's own theme, and the frame only exists once a visitor asks for it.
export function EmbedCard({ link, look }: { link: Link; look: any }) {
  const [open, setOpen] = useState(false)
  // Derived first, stored second: only Bandcamp uses the stored path.
  const embed = detectEmbed(link.url) || storedEmbed(link.embed_src, link.embed_height)

  useEffect(() => {
    function onOther(e: Event) {
      const id = (e as CustomEvent).detail
      if (id !== link.id) setOpen(false)
    }
    window.addEventListener(OPENED, onOther)
    return () => window.removeEventListener(OPENED, onOther)
  }, [link.id])

  if (!embed) return null
  const name = embedName(embed.kind)
  // "Play Book a call from Cal.com" is nonsense. Booking gets its own verb.
  const isBooking = embed.kind === 'calcom' || embed.kind === 'calendly'
  const verb = isBooking ? 'Open' : 'Play'

  // A pill radius is right for a button and wrong for a video: it crops the
  // picture into an oval. Frames get a sane corner whatever the theme asks for.
  const frameRadius = 16

  if (!open) {
    return (
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent(OPENED, { detail: link.id }))
          setOpen(true)
        }}
        className="embedposter"
        aria-label={verb + ' ' + link.title + ' from ' + name}
        style={{
          background: look.buttonBg,
          color: look.buttonText,
          border: look.buttonBorder,
          borderRadius: look.buttonRadius,
          boxShadow: look.buttonShadow,
        }}
      >
        <ServiceMark kind={embed.kind} />
        <span className="embedmeta">
          <span className="embedtitle">{link.title}</span>
          <span className="embedsource">{isBooking ? 'Book here' : 'Plays here'} · {name}</span>
        </span>
        <span className="embedgo" style={{ background: look.accentBg, color: look.accentText }} aria-hidden="true">{isBooking ? '\u2192' : '\u25B6'}</span>
      </button>
    )
  }

  return (
    <div className="embedframe" style={{ borderRadius: frameRadius, background: look.buttonBg }}>
      <div className="embedbar" style={{ color: look.buttonText }}>
        <ServiceMark kind={embed.kind} />
        <span className="embedtitle">{link.title}</span>
        <button className="embedclose" onClick={() => setOpen(false)}
          aria-label={(isBooking ? 'Close ' : 'Stop ') + link.title}>✕</button>
      </div>
      <iframe
        src={embed.src + (embed.kind === 'youtube' ? '?autoplay=1' : '')}
        title={link.title || name}
        height={embed.height}
        loading="lazy"
        allow={
          // Apple, TIDAL and Deezer serve DRM audio and need encrypted-media
          // delegated with an explicit allowlist rather than the bare keyword,
          // or the player loads and then refuses to start.
          embed.kind === 'applemusic' || embed.kind === 'tidal' || embed.kind === 'deezer'
            ? 'autoplay *; encrypted-media *; clipboard-write; picture-in-picture'
            : 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture'
        }
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        style={{ border: 'none', width: '100%', display: 'block' }}
      />
    </div>
  )
}
