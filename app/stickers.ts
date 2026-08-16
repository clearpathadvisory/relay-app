/**
 * The sticker catalogue.
 *
 * Files live in assets/stickers and are served straight from the site, not
 * from storage: they are the same for everybody, never change, and get cached
 * at the edge. Each was trimmed of transparent margin, capped at 320px and
 * converted to WebP — the source set was 32MB, which would have ruined load
 * time on exactly the pages people share.
 *
 * `ar` is width / height, used to size a sticker's box from its width alone so
 * nothing is ever stretched.
 */

export type Sticker = { id: string; cat: string; ar: number }

export const STICKER_CATS = ["Stars", "Nature", "Shapes", "Characters", "Halloween", "Misc"]

export const STICKERS: Sticker[] = [
  { id: 'cs-moon-1', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-1', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-10', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-12', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-13', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-4', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-5', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-6', cat: 'Stars', ar: 1.0 },
  { id: 'cs-star-9', cat: 'Stars', ar: 1.0 },
  { id: 'star-password', cat: 'Stars', ar: 1.034 },
  { id: 'abstract-tree', cat: 'Nature', ar: 0.874 },
  { id: 'cs-flower-10', cat: 'Nature', ar: 1.0 },
  { id: 'cs-flower-11', cat: 'Nature', ar: 0.9 },
  { id: 'cs-flower-12', cat: 'Nature', ar: 1.0 },
  { id: 'cs-flower-2', cat: 'Nature', ar: 1.053 },
  { id: 'cs-flower-6', cat: 'Nature', ar: 1.0 },
  { id: 'flower-windmill-nature', cat: 'Nature', ar: 1.0 },
  { id: 'shape-leaves-nature-fan', cat: 'Nature', ar: 0.904 },
  { id: 'cs-ellipse-1', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-ellipse-11', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-ellipse-12', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-number-0', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-number-1', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-2', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-3', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-4', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-5', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-6', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-7', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-8', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-number-9', cat: 'Shapes', ar: 0.9 },
  { id: 'cs-rectangle-5', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-rectangle-8', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-rectangle-9', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-triangle-14', cat: 'Shapes', ar: 0.981 },
  { id: 'cs-triangle-4', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-triangle-5', cat: 'Shapes', ar: 1.088 },
  { id: 'cs-triangle-7', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-triangle-9', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-wheel-1', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-wheel-2', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-wheel-5', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-wheel-6', cat: 'Shapes', ar: 1.0 },
  { id: 'cs-wheel-7', cat: 'Shapes', ar: 1.042 },
  { id: '20250805-1654-angry-blue-rhino-simple-co', cat: 'Characters', ar: 1.032 },
  { id: '20250806-0137-glossy-rubber-duck-simple-', cat: 'Characters', ar: 0.911 },
  { id: 'monsters', cat: 'Characters', ar: 0.769 },
  { id: 'monsters-1', cat: 'Characters', ar: 1.616 },
  { id: 'halloween-stickers', cat: 'Halloween', ar: 0.941 },
  { id: 'halloween-stickers-1', cat: 'Halloween', ar: 1.092 },
  { id: 'halloween-stickers-10', cat: 'Halloween', ar: 1.009 },
  { id: 'halloween-stickers-2', cat: 'Halloween', ar: 1.026 },
  { id: 'halloween-stickers-3', cat: 'Halloween', ar: 0.828 },
  { id: 'halloween-stickers-4', cat: 'Halloween', ar: 1.003 },
  { id: 'halloween-stickers-5', cat: 'Halloween', ar: 0.872 },
  { id: 'halloween-stickers-6', cat: 'Halloween', ar: 1.115 },
  { id: 'halloween-stickers-7', cat: 'Halloween', ar: 0.969 },
  { id: 'halloween-stickers-8', cat: 'Halloween', ar: 1.092 },
  { id: 'halloween-stickers-9', cat: 'Halloween', ar: 0.956 },
  { id: '9562781-status-project-awesome-done-rock', cat: 'Misc', ar: 0.938 },
  { id: '9562791-done-rocket-launch-status-projec', cat: 'Misc', ar: 0.96 },
  { id: 'a-slice-of-resistance', cat: 'Misc', ar: 1.0 },
  { id: 'abstract-tray', cat: 'Misc', ar: 1.276 },
  { id: 'circle-point-target', cat: 'Misc', ar: 1.0 },
  { id: 'cs-misc-1', cat: 'Misc', ar: 1.0 },
  { id: 'cs-misc-10', cat: 'Misc', ar: 1.0 },
  { id: 'cs-misc-11', cat: 'Misc', ar: 1.0 },
  { id: 'cs-misc-3', cat: 'Misc', ar: 1.0 },
  { id: 'cs-misc-7', cat: 'Misc', ar: 1.0 },
  { id: 'frame-85', cat: 'Misc', ar: 1.151 },
  { id: 'group-115', cat: 'Misc', ar: 0.903 },
  { id: 'group-48', cat: 'Misc', ar: 0.992 },
  { id: 'group-49', cat: 'Misc', ar: 1.008 },
  { id: 'group-68', cat: 'Misc', ar: 0.96 },
  { id: 'group-75', cat: 'Misc', ar: 1.053 },
  { id: 'heart', cat: 'Misc', ar: 1.281 },
  { id: 'shape-circle-loading-spin-propeller', cat: 'Misc', ar: 1.012 },
  { id: 'shape-hashtag-waffle', cat: 'Misc', ar: 1.0 },
  { id: 'shape-vase-ton', cat: 'Misc', ar: 0.868 },
  { id: 'square-frame', cat: 'Misc', ar: 1.0 },
  { id: 'square-stamp-2', cat: 'Misc', ar: 1.0 },
]

export const STICKER_BY_ID: Record<string, Sticker> =
  Object.fromEntries(STICKERS.map((s) => [s.id, s]))

export function stickerSrc(id: string) {
  return '/stickers/' + id + '.webp'
}

/**
 * One placed sticker. x and w are fractions of the card's WIDTH. So is y —
 * measured downward from the top edge, NOT as a fraction of the card's
 * height.
 *
 * That distinction is the whole point. A CSS percentage in `top` resolves
 * against the parent's height, so while y meant 'fraction of height' a
 * sticker moved every time the owner added a link: same stored value, taller
 * card, different place on the page. Anchoring to width makes y a fixed
 * offset from the top that no amount of content below can disturb.
 *
 * A page is taller than it is wide, so y legitimately exceeds 1 — a sticker
 * two card-widths down the page has y = 2.
 */
export type Placed = { s: string; x: number; y: number; w: number; r: number }

export const MAX_STICKERS = 30

/** Furthest a sticker may sit below the top edge, in card widths. */
export const Y_MAX = 12

/**
 * Accepts whatever came back from the database and returns only entries that
 * are safe to render: known sticker id, numbers in range, capped count. The
 * column is validated on write too, but a page read should never be able to
 * put a broken value into a style attribute.
 */
export function safeStickers(raw: any): Placed[] {
  if (!Array.isArray(raw)) return []
  const out: Placed[] = []
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue
    const s = String(e.s || '')
    if (!STICKER_BY_ID[s]) continue
    const x = Number(e.x), y = Number(e.y), w = Number(e.w), r = Number(e.r)
    if (!isFinite(x) || !isFinite(y) || !isFinite(w)) continue
    out.push({
      s,
      x: Math.min(1.2, Math.max(-0.2, x)),
      y: Math.min(Y_MAX, Math.max(-0.2, y)),
      w: Math.min(0.9, Math.max(0.04, w)),
      r: isFinite(r) ? Math.min(180, Math.max(-180, r)) : 0,
    })
    if (out.length >= MAX_STICKERS) break
  }
  return out
}
