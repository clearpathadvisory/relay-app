'use client'

import { supabase, Link } from '../../lib/supabase'

export function LinkButton({ link, look }: { link: Link; look: any }) {
  const primary = link.is_primary

  async function go(e: any) {
    e.preventDefault()
    try {
      await supabase.rpc('record_click', {
        p_link_id: link.id,
        p_referrer: document.referrer || null,
        p_device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })
    } catch (err) {}
    window.open(link.url, '_blank', 'noopener')
  }

  return (
    <a href={link.url} onClick={go} className={primary ? 'jiggle' : undefined}
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
        <img src={link.favicon_url} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <span style={{ width: 28, flexShrink: 0 }} />
      )}
      <span className="linklabel" style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.35, paddingRight: 40, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{link.title}</span>
    </a>
  )
}
