'use client'

import { useRef, useState, useEffect } from 'react'
import { Theme, Link, Page, Social, resolveLook } from '../../lib/supabase'
import { SocialIcon, socialHref } from '../socialicons'

export function Phone({ page, links, theme, showBrand, socials = [] }: { page: Page; links: Link[]; theme: Theme | undefined; showBrand: boolean; socials?: Social[] }) {
  const L = resolveLook(page, theme)
  const initials = (page.display_name || page.username).slice(0, 2).toUpperCase()
  const hasAvatar = !!(page.avatar_url && page.avatar_url.length > 4)
  const shown = links.filter((l) => l.is_active)
  const many = shown.length > 5
  const tight = shown.length > 8

  // the scrollbar only appears while the frame is actually being scrolled
  const [scrolling, setScrolling] = useState(false)
  const hideTimer = useRef<any>(null)
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])
  function onScroll() {
    setScrolling(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setScrolling(false), 900)
  }

  const shell: any = {
    width: 340, height: 690, borderRadius: 40, overflow: 'hidden',
    background: L.bg, backgroundSize: 'cover',
    boxShadow: '0 18px 44px rgba(27,13,68,.18)', fontFamily: L.font,
    border: '9px solid #16102E', flexShrink: 0,
  }
  if (L.bgImage) {
    shell.backgroundImage = 'url(' + L.bgImage + ')'
    shell.backgroundSize = 'cover'
    shell.backgroundPosition = 'center'
  }

  const av: any = {
    width: 82, height: 82, borderRadius: '50%', margin: '0 auto 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 25, fontWeight: 700, overflow: 'hidden', flexShrink: 0,
  }
  if (!hasAvatar) { av.backgroundColor = L.accentBg; av.color = L.accentText }

  const wrap: any = { overflowWrap: 'anywhere', wordBreak: 'break-word' }

  return (
    <div className="phoneframe" style={shell}>
      <div className={'phonescroll' + (scrolling ? ' scrolling' : '')} onScroll={onScroll}
        style={{ background: L.bgImage ? 'rgba(0,0,0,.2)' : 'transparent' }}>
        <div style={{ padding: many ? '26px 20px 46px' : '34px 22px 52px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={av}>
            {hasAvatar ? <img src={page.avatar_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>

          <p style={{ textAlign: 'center', margin: 0, fontSize: 17, fontWeight: 700, color: L.nameColor, ...wrap }}>
            {page.display_name || page.username}
          </p>
          <p style={{ textAlign: 'center', margin: '7px 0 14px', fontSize: 13, lineHeight: 1.5, color: L.bioColor, whiteSpace: 'pre-wrap', ...wrap }}>
            {page.bio}
          </p>

          {socials.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
              {socials.map((sc) => (
                <SocialIcon key={sc.id} id={sc.platform} color={L.iconColor} size={20} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: tight ? 8 : many ? 9 : 11 }}>
            {shown.map((l) => (
              <div key={l.id} className={l.is_primary ? 'jiggle' : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: tight ? '10px 12px' : many ? '12px 13px' : '14px 14px', fontSize: tight ? 12.5 : 13,
                fontWeight: l.is_primary ? 700 : 500, borderRadius: L.buttonRadius,
                background: l.is_primary ? L.accentBg : L.buttonBg,
                color: l.is_primary ? L.accentText : L.buttonText,
                border: l.is_primary ? 'none' : L.buttonBorder, boxShadow: L.buttonShadow,
              }}>
                {l.favicon_url ? (
                  <img src={l.favicon_url} alt="" style={{ width: 24, height: 24, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 24, flexShrink: 0 }} />
                )}
                <span style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.32, paddingRight: 24, ...wrap }}>{l.title}</span>
              </div>
            ))}
            {shown.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 12.5, color: L.bioColor }}>Nothing to relay yet.</p>
            )}
          </div>

          {showBrand && (
            <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: many ? 20 : 30 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: '#1B0D44', padding: '10px 17px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>
                <span style={{ width: 13, height: 13, borderRadius: 4, background: '#7C5CE6', display: 'inline-block' }} />
                Join {page.username} on Relay
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
