export function Blob({ size = 150, mood = 'happy', animated = true }: { size?: number; mood?: string; animated?: boolean }) {
  const smile = mood === 'sad' ? 'M66 108 Q80 96 94 108' : 'M66 98 Q80 112 94 98'
  const c = (n: string) => (animated ? n : undefined)
  return (
    <svg viewBox="0 0 160 170" width={size} height={(size * 170) / 160} aria-hidden="true">
      <ellipse className={c('blob-shadow')} cx="80" cy="158" rx="46" ry="7" fill="#E0D8FA" />
      <g className={c('blob-float')}>
        <g className={c('blob-antenna')}>
          <path d="M80 18 L80 6" stroke="#1B0D44" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="4" r="5" fill="#C6F15C" />
        </g>
        <path
          d="M80 18 C118 18 136 46 136 84 C136 122 114 146 80 146 C46 146 24 122 24 84 C24 46 42 18 80 18 Z"
          fill="#B0A0FF"
        />
        <circle className={c('blob-cheek')} cx="44" cy="92" r="6" fill="#F0A2FD" opacity="0.8" />
        <circle className={c('blob-cheek')} cx="116" cy="92" r="6" fill="#F0A2FD" opacity="0.8" />
        <g className={c('blob-eyes')}>
          <g>
            <circle cx="62" cy="76" r="8" fill="#1B0D44" />
            <circle cx="64.5" cy="73" r="2.6" fill="#fff" />
          </g>
          <g className={c('blob-wink')}>
            <circle cx="98" cy="76" r="8" fill="#1B0D44" />
            <circle cx="100.5" cy="73" r="2.6" fill="#fff" />
          </g>
        </g>
        <path className={c('blob-smile')} d={smile} stroke="#1B0D44" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function Star({ color = '#C6F15C', size = 24, style = {}, className }: any) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={style} className={className} aria-hidden="true">
      <path d="M20 3 L23 16 L36 20 L23 24 L20 37 L17 24 L4 20 L17 16 Z" fill={color} />
    </svg>
  )
}

export function Robot({ size = 46, style = {}, className }: any) {
  return (
    <svg viewBox="0 0 44 52" width={size} height={(size * 52) / 44} style={style} className={className} aria-hidden="true">
      <path d="M22 12 L22 5" stroke="#1B0D44" strokeWidth="3" strokeLinecap="round" />
      <circle className="robot-bulb" cx="22" cy="3" r="3.4" fill="#C6F15C" />
      <rect x="6" y="12" width="32" height="24" rx="10" fill="#B0A0FF" />
      <g className="robot-eyes">
        <circle cx="15" cy="23" r="3.6" fill="#1B0D44" />
        <circle cx="29" cy="23" r="3.6" fill="#1B0D44" />
      </g>
      <circle cx="16.2" cy="21.8" r="1.2" fill="#fff" />
      <circle cx="30.2" cy="21.8" r="1.2" fill="#fff" />
      <path d="M17 30 Q22 34 27 30" stroke="#1B0D44" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <rect x="11" y="38" width="22" height="11" rx="5" fill="#7C5CE6" />
      <rect x="16" y="42" width="12" height="3" rx="1.5" fill="#C6F15C" />
      <path d="M6 22 L2 22 M38 22 L42 22" stroke="#1B0D44" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function Bear({ size = 44, style = {}, className }: any) {
  return (
    <svg viewBox="0 0 46 44" width={size} height={(size * 44) / 46} style={style} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" fill="#FEB591" />
      <circle cx="35" cy="11" r="7.5" fill="#FEB591" />
      <circle cx="11" cy="11" r="3.4" fill="#F0A2FD" />
      <circle cx="35" cy="11" r="3.4" fill="#F0A2FD" />
      <circle cx="23" cy="24" r="16" fill="#FEB591" />
      <circle cx="17" cy="21" r="2.6" fill="#1B0D44" />
      <circle cx="29" cy="21" r="2.6" fill="#1B0D44" />
      <ellipse cx="23" cy="30" rx="8" ry="6" fill="#FFF3EA" />
      <ellipse cx="23" cy="27.5" rx="2.8" ry="2.2" fill="#1B0D44" />
      <path d="M23 30 L23 32 M23 32 Q20 34 18.5 32 M23 32 Q26 34 27.5 32" stroke="#1B0D44" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Rocket({ size = 40, style = {}, className }: any) {
  return (
    <svg viewBox="0 0 34 52" width={size} height={(size * 52) / 34} style={style} className={className} aria-hidden="true">
      <path className="rocket-flame" d="M17 40 Q13 47 17 54 Q21 47 17 40 Z" fill="#FEB591" opacity="0.85" />
      <path d="M17 2 C25 10 27 20 27 30 L7 30 C7 20 9 10 17 2 Z" fill="#B0A0FF" />
      <circle cx="17" cy="17" r="5.2" fill="#FBFAF9" />
      <circle cx="17" cy="17" r="2.6" fill="#7C5CE6" />
      <path d="M7 26 L1 34 L7 33 Z" fill="#F0A2FD" />
      <path d="M27 26 L33 34 L27 33 Z" fill="#F0A2FD" />
      <path d="M12 30 L22 30 L20 37 L14 37 Z" fill="#1B0D44" />
      <path d="M17 40 Q14 45 17 50 Q20 45 17 40 Z" fill="#C6F15C" />
    </svg>
  )
}

export function Squiggle({ color = '#B0A0FF', size = 54, style = {}, className }: any) {
  return (
    <svg viewBox="0 0 60 20" width={size} height={(size * 20) / 60} style={style} className={className} aria-hidden="true">
      <path d="M2 12 Q10 2 18 12 T34 12 T50 12" stroke={color} strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
