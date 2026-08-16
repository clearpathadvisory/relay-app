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
 * Horizontal values are plain percentages, which CSS resolves against width.
 * Vertical position uses cqw — 1% of this layer's own inline size — because a
 * percentage in `top` would resolve against HEIGHT, and then every sticker
 * would slide the moment the owner added a link. cqw makes y a fixed offset
 * from the top edge, so content growing below it changes nothing.
 */
export function StickerLayer({ stickers }: { stickers: Placed[] }) {
  if (!stickers.length) return null
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        // Establishes the containment context that the cqw units below read.
        containerType: 'inline-size',
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
              left: st.x * 100 + '%',
              top: st.y * 100 + 'cqw',
              width: st.w * 100 + '%',
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
