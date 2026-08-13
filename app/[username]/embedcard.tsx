'use client'

import { useState } from 'react'
import { Link } from '../../lib/supabase'
import { detectEmbed, embedName } from '../../lib/embed'

// Click to load, deliberately. A page that nobody has interacted with makes no
// request to YouTube, Spotify or SoundCloud at all — the poster below is drawn
// from the page's own theme, and the frame only exists after a visitor asks for
// it. That keeps the promise the rest of the product makes about not handing a
// visitor's address to third parties on arrival, and it keeps the page fast.
export function EmbedCard({ link, look }: { link: Link; look: any }) {
  const [open, setOpen] = useState(false)
  const embed = detectEmbed(link.url)

  // if the url stopped being embeddable, fall back to nothing and let the
  // caller render an ordinary button instead
  if (!embed) return null

  const name = embedName(embed.kind)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="embedposter"
        aria-label={'Play ' + link.title + ' from ' + name}
        style={{
          background: look.buttonBg,
          color: look.buttonText,
          border: look.buttonBorder,
          borderRadius: look.buttonRadius,
          boxShadow: look.buttonShadow,
        }}
      >
        <span className="embedplay" style={{ background: look.accentBg, color: look.accentText }} aria-hidden="true">▶</span>
        <span className="embedmeta">
          <span className="embedtitle">{link.title}</span>
          <span className="embedsource">Plays here · {name}</span>
        </span>
      </button>
    )
  }

  return (
    <div className="embedframe" style={{ borderRadius: look.buttonRadius, background: look.buttonBg }}>
      <iframe
        src={embed.src + (embed.kind === 'youtube' ? '?autoplay=1' : '')}
        title={link.title || name}
        height={embed.height}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        style={{ border: 'none', width: '100%', display: 'block', borderRadius: look.buttonRadius }}
      />
    </div>
  )
}
