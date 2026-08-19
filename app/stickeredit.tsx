'use client'

import { useEffect, useRef, useState } from 'react'
import { Placed, STICKER_BY_ID, stickerSrc, MAX_STICKERS, X_MAX, Y_MAX, W_MIN, W_MAX } from './stickers'

/**
 * The draggable sticker layer shown inside the dashboard preview.
 *
 * Pointer events rather than mouse plus touch: one code path covers a mouse, a
 * finger and a stylus, and setPointerCapture means a fast drag that leaves the
 * card still tracks instead of the sticker being dropped mid-gesture.
 *
 * All maths is in fractions of the card. The card is 322px in the preview and
 * 520px on the real page, so working in pixels here would place stickers
 * somewhere different for visitors than for the person arranging them.
 */

type Mode = 'move' | 'size' | null

// How close to the centre line a drag has to get before it snaps, in CARD
// pixels — the unit sticker x is stored in, not screen pixels.
//
// That distinction matters: the preview draws the 520px card at roughly half
// size, so this figure is about halved again by the time a finger feels it.
// The first attempt used 6, which came out around 3 screen pixels and could
// not be found on purpose, let alone by accident.
const SNAP_X = 18

export function StickerEdit({
  stickers, setStickers, commit, selected, setSelected, scale = 1,
}: {
  stickers: Placed[]
  /**
   * How small this copy of the page is drawn. The dashboard preview renders
   * the 520px page under CSS zoom, so a pointer moving 10px on screen has
   * moved 10/scale page pixels. Sizes and offsets are stored against the
   * page, never against the screen, so pointer input is divided by this on
   * the way in. Nothing is multiplied on the way out — zoom already draws
   * everything at the right size.
   */
  scale?: number
  /** Called on every frame of a drag. Local state only — never the database. */
  setStickers: (v: Placed[]) => void
  /** Called once when the gesture ends, and for add/delete. This one saves. */
  commit: (v: Placed[]) => void
  selected: number | null
  setSelected: (i: number | null) => void
}) {
  const wrap = useRef<HTMLDivElement | null>(null)
  const drag = useRef<any>(null)
  // Shown only while a drag is actually on the centre line, so it reads as
  // feedback rather than decoration.
  const [guide, setGuide] = useState(false)
  const [, force] = useState(0)

  // Deleting with the keyboard is what people try first once something is
  // selected. Escape to deselect is the other half of that expectation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selected === null) return
      const t = e.target as HTMLElement
      if (t && /input|textarea|select/i.test(t.tagName)) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        commit(stickers.filter((_, i) => i !== selected))
        setSelected(null)
      } else if (e.key === 'Escape') {
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, stickers, commit, setSelected])

  // The overlay is pointer-events:none so the preview still scrolls, which
  // means it cannot catch an outside click itself. Listening on the document
  // instead: anything that is not part of a sticker clears the selection, so
  // the handles do not sit there permanently once the person moves on.
  useEffect(() => {
    if (selected === null) return
    function onDown(e: PointerEvent) {
      const t = e.target as HTMLElement | null
      if (t && t.closest && t.closest('[data-sticker]')) return
      setSelected(null)
    }
    // Capture phase, so this runs even when a handler below stops propagation.
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [selected, setSelected])

  function rect() {
    return wrap.current ? wrap.current.getBoundingClientRect() : null
  }

  function start(e: React.PointerEvent, i: number, mode: Mode) {
    e.preventDefault()
    e.stopPropagation()
    const r = rect()
    if (!r) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setSelected(i)
    drag.current = {
      i, mode, pointerId: e.pointerId,
      // Both are page pixels, so screen pixels are divided back out.
      startX: (e.clientX - (r.left + r.width / 2)) / scale,
      startY: (e.clientY - r.top) / scale,
      orig: { ...stickers[i] },
      w: r.width, h: r.height,
    }
    force((n) => n + 1)
  }

  function move(e: React.PointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const r = rect()
    if (!r) return
    const px = (e.clientX - (r.left + r.width / 2)) / scale
    const py = (e.clientY - r.top) / scale
    d.moved = true
    const next = stickers.slice()

    if (d.mode === 'move') {
      // Kept fully inside the card. x and y are the sticker's CENTRE, so the
      // limit is half its own width in from each edge — otherwise it slides
      // under the phone bezel and looks broken rather than playful. Both
      // bounds come from the card's real measured size, in the same pixels
      // the value is stored in.
      // x is a fraction, so its bound is expressed as one too: half the
      // sticker's own width converted into fractions of the card. That keeps
      // it inside the edge on THIS card — and because x scales with width, it
      // stays inside on every narrower one as well.
      // The editor draws the 520px page, so the drag may go as wide as the
      // page allows. Narrower screens are handled at render by the clamp,
      // not by refusing the placement here.
      const half = d.orig.w / 2
      const xLim = Math.min(X_MAX, r.width / scale / 2 - half)
      let nx = clamp(d.orig.x + (px - d.startX), -xLim, xLim)

      // Snap to the card's centre line. A sticker dropped beside the display
      // name is read as part of it, so a few pixels off centre makes the NAME
      // look crooked even though the name has not moved at all — it cannot,
      // the layer is absolutely positioned. Rather than explain that, make
      // centring the easy thing to land on.
      //
      // 6px is deliberately small: enough to catch someone aiming for centre,
      // not enough to fight someone placing a sticker just off to one side.
      const snapped = Math.abs(nx) <= SNAP_X
      if (snapped) nx = 0
      setGuide(snapped)

      next[d.i] = {
        ...d.orig,
        x: nx,
        y: clamp(d.orig.y + (py - d.startY), half, Math.min(Y_MAX, r.height / scale - half)),
      }
    } else if (d.mode === 'size') {
      // Distance from the sticker's centre to the pointer drives the width, so
      // the corner handle follows the finger instead of drifting away from it.
      const dx = px - d.orig.x
      const dy = py - d.orig.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const w = clamp(dist * 1.9, W_MIN, W_MAX)
      // Growing a sticker near an edge would push it past the boundary that the
      // drag path enforces, so nudge the centre back in as it grows.
      const half = w / 2
      const xLim = Math.min(X_MAX, r.width / scale / 2 - half)
      next[d.i] = { ...d.orig, w, x: clamp(d.orig.x, -xLim, xLim) }
    }
    setStickers(next)
  }

  function end(e: React.PointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    // Save the position the gesture finished on. Everything up to this point
    // was local, so the row is written once per drag rather than per frame.
    if (d.moved) commit(stickers)
    force((n) => n + 1)
  }

  return (
    <div
      ref={wrap}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden',
        zIndex: 3, touchAction: 'none',
        // The layer spans the whole phone so a drag can run anywhere, but it
        // must not swallow input: with pointerEvents none here and auto on each
        // sticker, the preview still scrolls and its links still respond
        // everywhere a sticker is not.
        pointerEvents: 'none',
      }}
    >
      {guide && (
        <span style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
          transform: 'translateX(-1px)', background: 'var(--violet)',
          // Solid rather than faint: this is the confirmation that the sticker
          // has locked to the centre, so it has to be unmistakable at preview
          // size, where a hairline at 55% opacity all but disappears.
          opacity: .9, pointerEvents: 'none',
          boxShadow: '0 0 0 1px rgba(255,255,255,.55)',
        }} />
      )}

      {stickers.map((st, i) => {
        const meta = STICKER_BY_ID[st.s]
        if (!meta) return null
        const on = selected === i
        return (
          <div
            key={i}
            data-sticker="1"
            onPointerDown={(e) => start(e, i, 'move')}
            style={{
              position: 'absolute',
              left: `clamp(${st.w / 2}px, calc(50% + ${st.x}px), calc(100% - ${st.w / 2}px))`,
              top: st.y + 'px',
              width: st.w + 'px',
              transform: `translate(-50%, -50%) rotate(${st.r}deg)`,
              cursor: 'grab', touchAction: 'none', pointerEvents: 'auto',
            }}
          >
            <img src={stickerSrc(st.s)} alt="" draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none' }} />

            {on && (
              <>
                <span style={{
                  position: 'absolute', inset: -4, border: '1.5px dashed var(--violet)',
                  borderRadius: 6, pointerEvents: 'none',
                }} />
                {/* Resize grabs the bottom-right, delete sits top-right: the
                    arrangement people already know from every image editor. */}
                <button
                  onPointerDown={(e) => start(e, i, 'size')}
                  aria-label="Resize sticker"
                  style={handle(-10, -10, 'var(--violet)', '#fff')}
                >⤡</button>
                <button
                  onPointerDown={(e) => { e.stopPropagation() }}
                  onClick={(e) => {
                    e.stopPropagation()
                    commit(stickers.filter((_, k) => k !== i))
                    setSelected(null)
                  }}
                  aria-label="Delete sticker"
                  style={{ ...handle(-10, undefined, '#C0472F', '#fff'), top: -10, bottom: 'auto' }}
                >×</button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function handle(right: number, bottom: number | undefined, bg: string, fg: string): any {
  return {
    position: 'absolute', right, bottom,
    width: 26, height: 26, borderRadius: '50%',
    background: bg, color: fg, border: '2px solid #fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, lineHeight: 1, cursor: 'pointer', padding: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,.25)', touchAction: 'none',
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

export { MAX_STICKERS }
