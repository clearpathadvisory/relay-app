import { Placed, STICKER_BY_ID, stickerSrc } from './stickers'

/**
 * Draws placed stickers over a card.
 *
 * Used by the public page and by the dashboard preview, deliberately the same
 * component: the whole promise of the editor is that what you arrange is what
 * visitors see, and two implementations would drift the first time either was
 * touched.
 *
 * The parent must be position:relative.
 *
 * x is a fraction of width measured from the centre line, so `left: 50%` plus
 * a percentage; y and w are plain pixels. Nothing reads the card's HEIGHT,
 * which is what stops a longer page from moving a sticker, and x scaling with
 * width is what stops a narrow screen from pushing one off the edge. */
export function StickerLayer({ stickers, sizeScale = 1 }:
  { stickers: Placed[]; sizeScale?: number }) {
  if (!stickers.length) return null
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        // Stickers are decoration. Letting them eat clicks would put invisible
        // dead zones over the links, which is the entire point of the page.
        pointerEvents: 'none',
        borderRadius: 'inherit', zIndex: 1,
      }}
    >
      {stickers.map((st, i) => {
        const meta = STICKER_BY_ID[st.s]
        if (!meta) return null
        return (
          <img
            key={i}
            src={stickerSrc(st.s)}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute',
              left: `calc(50% + ${st.x * 100}%)`,
              top: st.y + 'px',
              width: st.w * sizeScale + 'px',
              height: 'auto',
              // Translating by half its own size means x/y describe the
              // sticker's centre, so rotation spins in place instead of
              // swinging the sticker around its top-left corner.
              transform: `translate(-50%, -50%) rotate(${st.r}deg)`,
              userSelect: 'none',
            }}
          />
        )
      })}
    </div>
  )
}
