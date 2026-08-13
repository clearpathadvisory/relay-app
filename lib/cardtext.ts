// Text destined for a generated image.
//
// Satori — the renderer behind every card here — has no emoji glyphs. It does
// not fail on one; it draws nothing, so a bio of 🚀🚀🚀 produced a blank card
// rather than an error. Asking it to fetch emoji pictures instead did not work
// either, so the card no longer depends on drawing them at all: they are taken
// out, and if that leaves nothing, something readable is used in their place.
const PICTOGRAPHS =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu

export function cardText(input: string | null | undefined, fallback = ''): string {
  const stripped = (input || '')
    .replace(PICTOGRAPHS, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return stripped || fallback
}
