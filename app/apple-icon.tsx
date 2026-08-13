import { ImageResponse } from 'next/og'

// iOS ignores SVG favicons, so the home-screen icon is drawn here rather than
// shipping a binary into the repo. Same blob, same palette, no text.
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: '#F4F1FF',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(32 35) scale(0.40) translate(-80 -80)">
            <path d="M80 14 L80 -2" stroke="#1B0D44" strokeWidth="9" strokeLinecap="round" />
            <circle cx="80" cy="-6" r="11" fill="#C6F15C" />
            <path
              d="M80 18 C118 18 136 46 136 84 C136 122 114 146 80 146 C46 146 24 122 24 84 C24 46 42 18 80 18 Z"
              fill="#B0A0FF"
            />
            <circle cx="44" cy="92" r="7" fill="#F0A2FD" opacity="0.85" />
            <circle cx="116" cy="92" r="7" fill="#F0A2FD" opacity="0.85" />
            <circle cx="62" cy="76" r="10" fill="#1B0D44" />
            <circle cx="98" cy="76" r="10" fill="#1B0D44" />
            <path d="M64 100 Q80 116 96 100" stroke="#1B0D44" strokeWidth="8" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
