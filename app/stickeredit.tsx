'use client'

import { useEffect, useRef, useState } from 'react'
import { Placed, STICKER_BY_ID, stickerSrc, MAX_STICKERS } from './stickers'

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

export function StickerEdit({
  stickers, setStickers, commit, selected, setSelected,
}: {
  stickers: Placed[]
  /** Called on every frame of a drag. Local state only — never the database. */
  setStickers: (v: Placed[]) => void
  /** Called once when the gesture ends, and for add/delete. This one saves. */
  commit: (v: Placed[]) => void
  selected: number | null
  setSelected: (i: number | null) => void
}) {
  const wrap = useRef<HTMLDivElement | null>(null)
  const drag = useRef<any>(null)
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
      startX: (e.clientX - r.left) / r.width,
      startY: (e.clientY - r.top) / r.height,
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
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    d.moved = true
    const next = stickers.slice()

    if (d.mode === 'move') {
      next[d.i] = {
        ...d.orig,
        // Allowed slightly past the edge so a sticker can hang off the corner,
        // which is most of the charm of stickers. safeStickers clamps to the
        // same range when the page is read back.
        x: clamp(d.orig.x + (px - d.startX), -0.15, 1.15),
        y: clamp(d.orig.y + (py - d.startY), -0.15, 1.15),
      }
    } else if (d.mode === 'size') {
      // Distance from the sticker's centre to the pointer drives the width, so
      // the corner handle follows the finger instead of drifting away from it.
      const dx = px - d.orig.x
      const dy = (py - d.orig.y) * (r.height / r.width)
      const dist = Math.sqrt(dx * dx + dy * dy)
      next[d.i] = { ...d.orig, w: clamp(dist * 1.9, 0.06, 0.85) }
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
              left: st.x * 100 + '%',
              top: st.y * 100 + '%',
              width: st.w * 100 + '%',
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
