import { ImageResponse } from 'next/og'

// iOS ignores SVG favicons, so the home-screen icon is drawn here instead of
// shipping a binary PNG into the repo.
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: '#7C5CE6',
        }}
      >
        <div
          style={{
            display: 'flex', width: 88, height: 22, borderRadius: 11,
            background: '#FFFFFF', transform: 'rotate(-45deg)',
          }}
        />
        <div
          style={{
            display: 'flex', position: 'absolute', top: 30, right: 30,
            width: 44, height: 44, borderRadius: 22, background: '#C6F15C',
          }}
        />
      </div>
    ),
    size
  )
}
