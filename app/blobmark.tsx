// The fallback when a site has no icon of its own.
//
// It used to be Google's favicon service, which meant two things: a broken
// image whenever that service 404s, and every visitor's browser contacting
// gstatic.com on page load — a third-party request on a product that promises
// none. This is drawn inline instead, so it always renders and reaches nobody.
export function BlobMark({ size = 28, radius = 8 }: { size?: number; radius?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, display: 'block' }}
    >
      <rect width="64" height="64" rx={radius * 2} fill="#F4F1FF" />
      <g transform="translate(32 35) scale(0.36) translate(-80 -80)">
        <path d="M80 14 L80 -2" stroke="#1B0D44" strokeWidth="9" strokeLinecap="round" />
        <circle cx="80" cy="-6" r="11" fill="#C6F15C" />
        <path d="M80 18 C118 18 136 46 136 84 C136 122 114 146 80 146 C46 146 24 122 24 84 C24 46 42 18 80 18 Z" fill="#B0A0FF" />
        <circle cx="62" cy="76" r="10" fill="#1B0D44" />
        <circle cx="98" cy="76" r="10" fill="#1B0D44" />
        <path d="M64 100 Q80 116 96 100" stroke="#1B0D44" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}
