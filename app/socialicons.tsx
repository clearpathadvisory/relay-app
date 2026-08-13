export const SOCIALS = [
  { id: 'instagram', name: 'Instagram', hint: 'instagram.com/you' },
  { id: 'tiktok', name: 'TikTok', hint: 'tiktok.com/@you' },
  { id: 'x', name: 'X', hint: 'x.com/you' },
  { id: 'youtube', name: 'YouTube', hint: 'youtube.com/@you' },
  { id: 'linkedin', name: 'LinkedIn', hint: 'linkedin.com/in/you' },
  { id: 'facebook', name: 'Facebook', hint: 'facebook.com/you' },
  { id: 'github', name: 'GitHub', hint: 'github.com/you' },
  { id: 'spotify', name: 'Spotify', hint: 'open.spotify.com/...' },
  { id: 'email', name: 'Email', hint: 'you@email.com' },
  { id: 'website', name: 'Website', hint: 'yoursite.com' },
]

export function socialName(id: string) {
  const s = SOCIALS.filter((x) => x.id === id)[0]
  return s ? s.name : id
}

// Turn what someone typed into something a browser can open.
export function socialHref(platform: string, raw: string) {
  const v = (raw || '').trim()
  if (!v) return '#'
  if (platform === 'email') return v.indexOf('mailto:') === 0 ? v : 'mailto:' + v.replace(/^@/, '')
  if (/^https?:\/\//i.test(v)) return v
  const handle = v.replace(/^@/, '')
  const base: any = {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
    x: 'https://x.com/',
    youtube: 'https://youtube.com/@',
    linkedin: 'https://linkedin.com/in/',
    facebook: 'https://facebook.com/',
    github: 'https://github.com/',
  }
  if (base[platform] && v.indexOf('.') < 0) return base[platform] + handle
  return 'https://' + v
}

export function SocialIcon({ id, color = '#1B0D44', size = 22 }: { id: string; color?: string; size?: number }) {
  const s = { width: size, height: size, display: 'block' } as any
  const st = { stroke: color, strokeWidth: 1.9, fill: 'none', strokeLinecap: 'round' as any, strokeLinejoin: 'round' as any }

  if (id === 'instagram')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...st} />
        <circle cx="12" cy="12" r="4.1" {...st} />
        <circle cx="17.1" cy="6.9" r="1.15" fill={color} />
      </svg>
    )

  if (id === 'tiktok')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <path d="M14.3 3.4v10.4a3.5 3.5 0 1 1-3.1-3.48" {...st} />
        <path d="M14.3 3.4c.5 2.4 2 3.9 4.5 4.2" {...st} />
      </svg>
    )

  if (id === 'x')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <path d="M5 4.6 L19 19.4 M19 4.6 L5 19.4" {...st} strokeWidth="2.1" />
      </svg>
    )

  if (id === 'youtube')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <rect x="2.6" y="5.6" width="18.8" height="12.8" rx="4.2" {...st} />
        <path d="M10.4 9.4 L15.4 12 L10.4 14.6 Z" fill={color} stroke="none" />
      </svg>
    )

  if (id === 'linkedin')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4.2" {...st} />
        <circle cx="8" cy="8.2" r="1.15" fill={color} />
        <path d="M8 11.2 v6 M12 17.2 v-3.4 a2.1 2.1 0 0 1 4.2 0 V17.2 M12 11.4 v.6" {...st} />
      </svg>
    )

  if (id === 'facebook')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <circle cx="12" cy="12" r="8.6" {...st} />
        <path d="M14.3 8.2h-1.2a1.8 1.8 0 0 0-1.8 1.8V20 M9.8 12.4h4.2" {...st} />
      </svg>
    )

  if (id === 'github')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <circle cx="12" cy="12" r="8.6" {...st} />
        <path d="M9.6 9.2 L7.2 12 l2.4 2.8 M14.4 9.2 L16.8 12 l-2.4 2.8 M13 8.6 l-2 6.8" {...st} />
      </svg>
    )

  if (id === 'spotify')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <circle cx="12" cy="12" r="8.6" {...st} />
        <path d="M7.9 9.7c2.7-.8 5.5-.5 8.1.8 M8.5 12.4c2.2-.6 4.4-.3 6.5.8 M9.2 15c1.7-.4 3.3-.2 4.9.6" {...st} />
      </svg>
    )

  if (id === 'email')
    return (
      <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
        <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="3.4" {...st} />
        <path d="M4.2 8 L12 13.2 L19.8 8" {...st} />
      </svg>
    )

  return (
    <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" {...st} />
      <path d="M3.5 12h17 M12 3.4c2.3 2.4 3.4 5.4 3.4 8.6S14.3 18.2 12 20.6c-2.3-2.4-3.4-5.4-3.4-8.6S9.7 5.8 12 3.4Z" {...st} />
    </svg>
  )
}
