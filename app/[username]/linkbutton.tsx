'use client'

import { supabase, Link } from '../../lib/supabase'

export function LinkButton({ link, look }: { link: Link; look: any }) {
  const primary = link.is_primary

  // Counting the tap must not get in the way of opening the link. Awaiting the
  // round trip and then calling window.open loses the user gesture, so Safari
  // and Firefox block the new tab and the link appears to do nothing. Letting
  // the browser follow the anchor itself also keeps middle-click, cmd-click and
  // "open in new tab" working, which a scripted open silently breaks.
  function count() {
    try {
      supabase.rpc('record_click', {
        p_link_id: link.id,
        p_referrer: document.referrer || null,
        p_device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })
    } catch (err) {}
  }

  return (
    <a
      href={link.url}
      target="_blank"
      // nofollow and ugc keep a page full of user-submitted links from reading
      // as a link farm to search engines; noopener protects the opened tab.
      rel="nofollow ugc noopener noreferrer"
      onClick={count}
      onAuxClick={count}
      className={primary ? 'linkbtn jiggle' : 'linkbtn'}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '16px 18px',
        fontSize: 15, fontWeight: primary ? 700 : 500,
        borderRadius: look.buttonRadius,
        background: primary ? look.accentBg : look.buttonBg,
        color: primary ? look.accentText : look.buttonText,
        border: primary ? 'none' : look.buttonBorder,
        boxShadow: look.buttonShadow,
      }}>
      {link.favicon_url ? (
        <img src={link.favicon_url} alt="" width={28} height={28} loading="lazy" decoding="async"
          style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <span style={{ width: 28, flexShrink: 0 }} />
      )}
      <span className="linklabel" style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.35, paddingRight: 40, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{link.title}</span>
    </a>
  )
}
