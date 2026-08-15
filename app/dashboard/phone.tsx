'use client'

import { useRef, useState, useEffect } from 'react'
import { Theme, Link, Page, Social, resolveLook } from '../../lib/supabase'
import { scheduleState } from '../../lib/schedule'
import { SocialIcon, socialHref } from '../socialicons'
import { BlobMark } from '../blobmark'

export function Phone({ page, links, theme, showBrand, socials = [] }: { page: Page; links: Link[]; theme: Theme | undefined; showBrand: boolean; socials?: Social[] }) {
  const L = resolveLook(page, theme)
  const initials = (page.display_name || page.username).slice(0, 2).toUpperCase()
  const hasAvatar = !!(page.avatar_url && page.avatar_url.length > 4)
  // matches the public page: a link outside its window is not there at all
  const shown = links.filter((l) => l.is_active && scheduleState(l) !== 'waiting' && scheduleState(l) !== 'ended')
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
    background: L.bg, ...(L.bgTiled ? {} : { backgroundSize: 'cover' }),
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
        <div style={{ padding: many ? '26px 20px 46px' : '34px 22px 52px', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <span style={{
            position: 'absolute', top: many ? 18 : 24, right: many ? 16 : 18,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 11px 6px 9px', borderRadius: 999,
            background: 'rgba(255,255,255,.16)', border: '1px solid ' + L.nameColor,
            color: L.nameColor, fontSize: 10.5, fontWeight: 700, opacity: .82,
          }}>
            <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
              <path d="M12 15.5V3.5M12 3.5 7.6 8M12 3.5 16.4 8" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.5 14v4.6A1.9 1.9 0 0 0 6.4 20.5h11.2a1.9 1.9 0 0 0 1.9-1.9V14" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
            </svg>
            Share
          </span>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: 11, flexWrap: 'wrap', marginBottom: 18 }}>
              {socials.map((sc) => (
                // The preview is a scaled-down phone, so this tracks the public
                // page's 36px rather than matching it: 30 here reads the same
                // size relative to the card as 36 does at full width.
                <SocialIcon key={sc.id} id={sc.platform} color={L.iconColor} size={30} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: tight ? 8 : many ? 9 : 11 }}>
            {shown.map((l) => l.kind === 'divider' ? (
              <hr key={l.id} style={{ border: 'none', height: 1, margin: '6px 14px', background: L.bioColor, opacity: .28 }} />
            ) : l.kind === 'heading' ? (
              <p key={l.id} style={{
                margin: '8px 2px 0', fontSize: tight ? 9 : 9.5, fontWeight: 800,
                letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center',
                color: L.bioColor, lineHeight: 1.4, ...wrap,
              }}>{l.title}</p>
            ) : (
              <div key={l.id} className={l.is_primary ? 'jiggle' : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, padding: tight ? '10px 12px' : many ? '12px 13px' : '14px 14px', fontSize: tight ? 12.5 : 13,
                fontWeight: l.is_primary ? 700 : 500, borderRadius: L.buttonRadius,
                background: l.is_primary ? L.accentBg : L.buttonBg,
                color: l.is_primary ? L.accentText : L.buttonText,
                border: l.is_primary ? 'none' : L.buttonBorder, boxShadow: L.buttonShadow,
              }}>
                {(l.image_url || l.favicon_url) ? (
                  <img src={(l.image_url || l.favicon_url) as string} alt="" style={{ width: 24, height: 24, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <BlobMark size={24} radius={7} />
                )}
                <span className="linklabel" style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.32, paddingRight: 34, ...wrap }}>{l.title}</span>
              </div>
            ))}
            {shown.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 12.5, color: L.bioColor }}>Nothing to relay yet.</p>
            )}
          </div>

          {page.capture_on && (
            <div style={{
              marginTop: 10, padding: '12px 12px 10px', borderRadius: L.buttonRadius,
              background: L.buttonBg, color: L.buttonText, border: L.buttonBorder,
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 10.5, fontWeight: 700, lineHeight: 1.35, ...wrap }}>
                {page.capture_heading || 'Get my emails'}
              </p>
              <div style={{ display: 'flex', gap: 5 }}>
                <span style={{
                  flex: 1, minWidth: 0, padding: '7px 8px', fontSize: 9,
                  border: '1px solid currentColor', borderRadius: 9, opacity: .45,
                }}>you@email.com</span>
                <span style={{
                  padding: '7px 10px', fontSize: 9, fontWeight: 700, borderRadius: L.buttonRadius,
                  background: L.accentBg, color: L.accentText, whiteSpace: 'nowrap',
                }}>{page.capture_button || 'Sign me up'}</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 7.5, lineHeight: 1.45, opacity: .7, ...wrap }}>
                {page.capture_note ? page.capture_note + ' ' : ''}
                We will email you once to check it is really you.
              </p>
            </div>
          )}

          {showBrand && (
            <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: many ? 20 : 30 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: '#1B0D44', padding: '10px 17px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>
                <span style={{ width: 13, height: 13, borderRadius: 4, background: '#7C5CE6', display: 'inline-block' }} />
                Join {page.username} on Relay
              </span>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7, flexWrap: 'wrap', marginTop: showBrand ? 20 : 'auto',
            paddingTop: showBrand ? 0 : 24,
            fontSize: 9.5, opacity: .72, color: L.bioColor,
          }}>
            <span>Privacy</span><span aria-hidden="true">·</span>
            <span>Terms</span><span aria-hidden="true">·</span>
            <span>Made with Relay</span>
          </div>
        </div>
      </div>
    </div>
  )
}
