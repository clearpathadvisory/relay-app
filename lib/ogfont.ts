import { readFile } from 'fs/promises'
import { join } from 'path'

// Satori cannot read woff2, so the OG card and the story image were falling
// back to a system font — a share card in a typeface the product never uses.
// These are static cuts of the same Manrope, loaded once per process.
let cached: any[] | null = null

export async function manropeFonts() {
  if (cached) return cached
  try {
    const dir = join(process.cwd(), 'assets', 'fonts')
    const [regular, bold] = await Promise.all([
      readFile(join(dir, 'manrope-regular.ttf')),
      readFile(join(dir, 'manrope-bold.ttf')),
    ])
    cached = [
      { name: 'Manrope', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Manrope', data: bold, weight: 700 as const, style: 'normal' as const },
    ]
    return cached
  } catch (e) {
    // A missing font must never turn a share card into a 500.
    return []
  }
}
