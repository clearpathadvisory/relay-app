'use client'

import { Link } from '../../lib/supabase'
import { BlobMark } from '../blobmark'

export function LinkButton({ link, look }: { link: Link; look: any }) {
  const primary = link.is_primary

  // Counting must not get in the way of opening the link. Awaiting a round trip
  // and then calling window.open loses the user gesture, so Safari and Firefox
  // block the new tab and the link appears dead. Letting the browser follow the
  // anchor itself also keeps middle-click and cmd-click working.
  //
  // sendBeacon survives the page going into the background, which a plain fetch
  // does not once the new tab takes focus.
  function count() {
    const body = JSON.stringify({ kind: 'click', linkId: link.id, referrer: document.referrer || '' })
    try {
      const nav: any = navigator
      if (nav && nav.sendBeacon) {
        nav.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
        return
      }
    } catch (e) {}
    try {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    } catch (e) {}
  }

  return (
    <a
      href={link.url}
      target="_blank"
      // nofollow and ugc keep a page of user-submitted links from reading as a
      // link farm to search engines; noopener protects the opened tab.
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
      {/* an uploaded thumbnail wins over the favicon we fetched */}
      {(link.image_url || link.favicon_url) ? (
        <img src={(link.image_url || link.favicon_url) as string} alt="" width={28} height={28}
          loading="lazy" decoding="async"
          style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <BlobMark size={28} radius={8} />
      )}
      <span className="linklabel" style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.35, paddingRight: 40, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{link.title}</span>
    </a>
  )
}
