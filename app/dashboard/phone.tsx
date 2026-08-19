'use client'

import { useRef, useState, useEffect } from 'react'
import { Theme, Link, Page, Social, resolveLook } from '../../lib/supabase'
import { scheduleState } from '../../lib/schedule'
import { detectEmbed, embedName, embedColor, EmbedKind } from '../../lib/embed'
import { SocialIcon } from '../socialicons'
import { BlobMark } from '../blobmark'
import { Placed, REF_CARD_W } from '../stickers'
import { StickerLayer } from '../stickerlayer'
import { StickerEdit } from '../stickeredit'

/**
 * The dashboard preview.
 *
 * This used to be a hand-tuned miniature: its own avatar size, its own type
 * scale, its own row padding, all chosen to look right at 340px. Every one of
 * those numbers was a chance to disagree with the real page, and they did —
 * a sticker placed beside the name in here landed over the bio out there,
 * because the name was 17px in one and 23px in the other.
 *
 * It now renders the public page's OWN dimensions at the public page's own
 * width, then shrinks the whole thing with CSS zoom. Nothing is re-tuned, so
 * nothing can drift: change a size on the public page and this follows.
 *
 * zoom rather than transform: scale, because zoom affects layout. The frame's
 * scroll height ends up correct on its own, where a transform would leave the
 * element claiming its full unscaled height and the phone scrolling through
 * empty space.
 */

// Public geometry: a 520px column inside 20px of card padding.
// The dot each service puts on its own play row used to be a second copy of
// the public component's colours here, which meant adding a service in one
// place and finding the preview still orange. embedColor() in lib/embed is now
// the only table, and this file reads it like everything else does.

const PAGE_PAD = 20
const PAGE_W = REF_CARD_W + PAGE_PAD * 2      // 560
const FRAME_H = 672                           // 690 less the 9px bezel each side
// Starting guess only. The real figure is measured below, because
// .phonescroll reserves a scrollbar gutter on both edges and the usable width
// is a few pixels narrower than the bezel — enough to clip the card's edge if
// the zoom is assumed rather than read.
const ZOOM_GUESS = 314 / PAGE_W



export function Phone({
  page, links, theme, showBrand, socials = [],
  stickers = [], editStickers = false, setStickers, commitStickers, stickerSel = null, setStickerSel,
}: {
  page: Page; links: Link[]; theme: Theme | undefined; showBrand: boolean; socials?: Social[]
  // Sticker props are optional so the Phone stays usable anywhere that just
  // wants a preview and has no editor around it.
  stickers?: Placed[]
  editStickers?: boolean
  setStickers?: (v: Placed[]) => void
  commitStickers?: (v: Placed[]) => void
  stickerSel?: number | null
  setStickerSel?: (i: number | null) => void
}) {
  const L = resolveLook(page, theme)
  const initials = (page.display_name || page.username).slice(0, 2).toUpperCase()
  const hasAvatar = !!(page.avatar_url && page.avatar_url.length > 4)
  // matches the public page: a link outside its window is not there at all
  const shown = links.filter((l) => l.is_active && scheduleState(l) !== 'waiting' && scheduleState(l) !== 'ended')

  // How far down the page has to be shrunk to fit this frame. Measured from
  // the element rather than assumed, so a change to the frame, the bezel or
  // the scrollbar gutter cannot silently start clipping the card — or, worse,
  // leave the sticker editor converting pointer moves against a stale figure.
  const scroller = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(ZOOM_GUESS)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setZoom(w / PAGE_W)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  // Identical to the public page's avatar, not a smaller cousin of it.
  const av: any = {
    width: 116, height: 116, borderRadius: '50%', overflow: 'hidden',
    margin: '0 auto 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 36, fontWeight: 700, flexShrink: 0,
  }
  if (!hasAvatar) { av.backgroundColor = L.accentBg; av.color = L.accentText }

  const wrap: any = { overflowWrap: 'anywhere', wordBreak: 'break-word' }

  return (
    <div className="phoneframe" style={shell}>
      <div
        ref={scroller}
        className={scrolling ? 'phonescroll scrolling' : 'phonescroll'}
        onScroll={onScroll}
        style={{ background: L.bgImage ? 'rgba(0,0,0,.2)' : 'transparent' }}
      >
        {/* Everything below is public-page sizing. The zoom is the only thing
            that makes it a preview. */}
        <div style={{ zoom, width: PAGE_W, padding: `54px ${PAGE_PAD}px 34px`, boxSizing: 'border-box', minHeight: FRAME_H / zoom }}>
          <div style={{ width: REF_CARD_W, margin: '0 auto', position: 'relative' }}>

            {/* Stickers sit against this 520px column, exactly as they do on
                the public page — same box, same numbers, same component. */}
            {!editStickers && <StickerLayer stickers={stickers} />}
            {editStickers && setStickers && setStickerSel && (
              <StickerEdit stickers={stickers} setStickers={setStickers}
                commit={commitStickers || setStickers}
                scale={zoom}
                selected={stickerSel} setSelected={setStickerSel} />
            )}

            {/* A still copy of the share control. Not the real button: nothing
                in a preview should be able to open a share sheet. */}
            <span style={{
              position: 'absolute', top: 0, right: 0,
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 15px 9px 13px', borderRadius: 999,
              background: 'rgba(255,255,255,.16)', border: '1px solid ' + L.nameColor,
              color: L.nameColor, fontSize: 13.5, fontWeight: 700, opacity: .82,
            }}>
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M12 15.5V3.5M12 3.5 7.6 8M12 3.5 16.4 8" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.5 14v4.6A1.9 1.9 0 0 0 6.4 20.5h11.2a1.9 1.9 0 0 0 1.9-1.9V14" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
              </svg>
              Share
            </span>

            <div style={av}>
              {hasAvatar ? (
                /* A <picture> with a media query, so the still is chosen by the
                   browser before a byte of the animation is fetched. Doing this
                   in JavaScript would download both and then hide one. */
                <picture style={{ display: 'contents' }}>
                  {page.avatar_poster_url ? (
                    <source media="(prefers-reduced-motion: reduce)" srcSet={page.avatar_poster_url} />
                  ) : null}
                  <img src={page.avatar_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </picture>
              ) : initials}
            </div>

            <h1 style={{ textAlign: 'center', fontSize: 25, margin: 0, fontWeight: 800, color: L.nameColor, ...wrap }}>
              {page.display_name || page.username}
            </h1>
            {page.bio && (
              // Matches the public page. This file is a second renderer, not a
              // miniature of the first, so an alignment changed out there has
              // to be changed in here too or the preview quietly lies.
              <p style={{
                // Must match the public page exactly. This file is a second
                // renderer, not a miniature of the first, so a change out there
                // has to be made in here too or the preview quietly lies.
                textAlign: 'center', fontSize: 15, margin: '10px 0 0', fontWeight: 600,
                color: L.bioColor, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                paddingLeft: 18, paddingRight: 18,
                ...wrap,
              }}>{page.bio}</p>
            )}

            {socials.length > 0 && (
              // 340px cap and 52px chips, same as the page, so a row of eight
              // wraps here exactly where it wraps there.
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px 20px', flexWrap: 'wrap', marginTop: 18, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
                {socials.map((sc) => (
                  <span key={sc.id} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 52, height: 52, borderRadius: '50%',
                    background: L.buttonBg, border: L.buttonBorder,
                    boxSizing: 'border-box',
                  }}>
                    <SocialIcon id={sc.platform} color={L.iconColor} size={28} />
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
              {shown.map((l) => l.kind === 'divider' ? (
                <hr key={l.id} style={{ border: 'none', height: 1, margin: '10px 22px', background: L.bioColor, opacity: .28 }} />
              ) : l.kind === 'heading' ? (
                <h2 key={l.id} style={{
                  margin: '14px 4px 2px', fontSize: 13, fontWeight: 800,
                  letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center',
                  color: L.bioColor, lineHeight: 1.4, ...wrap,
                }}>{l.title}</h2>
              ) : (l.embed_kind && (detectEmbed(l.url) || l.embed_src)) ? (
                // The play ROW, which is what a visitor actually sees. The
                // player itself only exists after they tap it, so drawing a
                // 16:9 block here showed a page that never happens — and it
                // pushed everything below it down by a couple of hundred
                // pixels that are not there on the real page.
                (() => {
                  const kind = (detectEmbed(l.url)?.kind || l.embed_kind) as EmbedKind
                  return (
                    <div key={l.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      minHeight: 56, padding: '14px 16px', fontSize: 15,
                      borderRadius: L.buttonRadius, background: L.buttonBg,
                      color: L.buttonText, border: L.buttonBorder, boxShadow: L.buttonShadow,
                    }}>
                      <span style={{
                        flexShrink: 0, width: 30, height: 30, borderRadius: 9,
                        background: embedColor(kind), display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                          <path d="M9.4 8.2 16.2 12 9.4 15.8Z" fill="#FFFFFF" />
                        </svg>
                      </span>
                      <span style={{
                        display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0,
                        flex: 1, alignItems: 'center', textAlign: 'center',
                      }}>
                        <span style={{ fontWeight: 600, lineHeight: 1.35, ...wrap }}>{l.title}</span>
                        <span style={{ fontSize: 12, opacity: .7 }}>Plays here · {embedName(kind)}</span>
                      </span>
                      <span style={{
                        flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                        background: L.accentBg, color: L.accentText, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 11, paddingLeft: 2,
                      }}>▶</span>
                    </div>
                  )
                })()
              ) : (
                <div key={l.id} className={l.is_primary ? 'jiggle' : undefined} style={{
                  display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '16px 18px',
                  fontSize: 15, fontWeight: l.is_primary ? 700 : 500,
                  borderRadius: L.buttonRadius,
                  background: l.is_primary ? L.accentBg : L.buttonBg,
                  color: l.is_primary ? L.accentText : L.buttonText,
                  border: l.is_primary ? 'none' : L.buttonBorder, boxShadow: L.buttonShadow,
                }}>
                  {(l.image_url || l.favicon_url) ? (
                    <img src={(l.image_url || l.favicon_url) as string} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <BlobMark size={28} radius={8} />
                  )}
                  <span className="linklabel" style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.35, paddingRight: 40, ...wrap }}>{l.title}</span>
                </div>
              ))}

              {page.capture_on && (
                <div style={{
                  padding: '18px 18px 16px', marginTop: 4, borderRadius: L.buttonRadius,
                  background: L.buttonBg, color: L.buttonText, border: L.buttonBorder,
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, lineHeight: 1.35, ...wrap }}>
                    {page.capture_heading || 'Get my emails'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      flex: 1, minWidth: 150, padding: '12px 14px', fontSize: 15,
                      border: '1px solid currentColor', borderRadius: 12, opacity: .45,
                    }}>you@email.com</span>
                    <span style={{
                      padding: '12px 20px', fontSize: 15, fontWeight: 700, borderRadius: L.buttonRadius,
                      background: L.accentBg, color: L.accentText, whiteSpace: 'nowrap',
                    }}>{page.capture_button || 'Sign me up'}</span>
                  </div>
                  {page.capture_note ? (
                    <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.5, opacity: .92, ...wrap }}>
                      {page.capture_note}
                    </p>
                  ) : null}
                  <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, opacity: .72, ...wrap }}>
                    We will email you once to check it is really you.
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, opacity: .72, ...wrap }}>
                    Your address goes to the owner of this page, not to RelayMe, and you can
                    leave from any message they send.
                  </p>
                </div>
              )}

              {shown.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 14, color: L.bioColor }}>Nothing to relay yet.</p>
              )}
            </div>

            {showBrand && (
              <div style={{ marginTop: 44, textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#FFFFFF', color: '#1B0D44', padding: '13px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, background: '#7C5CE6', display: 'inline-block' }} />
                  Join {page.username} on RelayMe
                </span>
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, flexWrap: 'wrap', margin: '30px 0 0',
              fontSize: 12.5, opacity: .72, color: L.bioColor,
            }}>
              <span>Privacy</span><span aria-hidden="true">·</span>
              <span>Terms</span><span aria-hidden="true">·</span>
              <span>Made with RelayMe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
