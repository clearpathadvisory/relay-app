import { ImageResponse } from 'next/og'
import { manropeFonts } from '../lib/ogfont'

// node rather than edge so the committed Manrope files can be read from disk
export const runtime = 'nodejs'
export const alt = 'Relay — one link for everything you make'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The card people see when relayme.bio itself is shared.
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#FBFAF9', padding: '0 90px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 34 }}>
          <div style={{ display: 'flex', width: 44, height: 44, borderRadius: 14, background: '#7C5CE6' }} />
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: '#1B0D44' }}>Relay</div>
        </div>

        <div
          style={{
            display: 'flex', textAlign: 'center', fontSize: 68, fontWeight: 700,
            color: '#1B0D44', lineHeight: 1.12, maxWidth: 960,
          }}
        >
          One link for everything you make
        </div>

        <div
          style={{
            display: 'flex', textAlign: 'center', fontSize: 30, color: '#5A4A8F',
            marginTop: 26, maxWidth: 820, lineHeight: 1.4,
          }}
        >
          Unlimited links, your own photo, 47 themes. Free to start.
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', marginTop: 46, background: '#C6F15C',
            color: '#1B0D44', borderRadius: 999, padding: '16px 34px', fontSize: 27, fontWeight: 700,
          }}
        >
          relayme.bio
        </div>
      </div>
    ),
    { ...size, fonts: await manropeFonts() }
  )
}
