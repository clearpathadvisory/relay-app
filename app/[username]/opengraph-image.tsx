import { ImageResponse } from 'next/og'
import { serverClient, resolveLook, Page, Theme } from '../../lib/supabase'

// Edge, as it always was. It was moved to node so it could read the committed
// Manrope files from disk, and it has returned 500 in production ever since —
// so the share card, which is the point, was traded for a typeface, which is
// not. The card renders in next/og's built-in font instead.
export const runtime = 'edge'
export const alt = 'A Relay page'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Not cached. revalidate = 0 also opts the read behind it out of the App
// Router's fetch cache, which is what made the card show a bio edited hours
// earlier. force-dynamic was the wrong tool here and returned a blank image.
export const revalidate = 0

// Satori's default font carries no emoji, so a bio of 🚀🚀🚀 drew literally
// nothing — a 755-byte blank card rather than an error. twemoji fetches the
// picture for each one at render time. That request is made by our server, not
// by anyone's browser, so it costs a visitor nothing.

// Rendered once per page and cached by Vercel, so a share on Instagram, X or
// WhatsApp shows the person's actual page rather than a bare grey card.
export default async function OgImage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).toLowerCase()
  const sb = serverClient()

  const { data: page } = await sb
    .from('pages')
    .select('*')
    .eq('username', username)
    .eq('is_published', true)
    .maybeSingle()

  if (!page) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBFAF9', color: '#1B0D44', fontSize: 56, fontWeight: 700 }}>
          relayme.bio
        </div>
      ),
      { ...size, emoji: 'twemoji' }
    )
  }

  const { data: theme } = await sb.from('themes').select('*').eq('id', page.theme_id).maybeSingle()
  const L = resolveLook(page as Page, theme as Theme)

  const name = page.display_name || page.username
  const bio = (page.bio || '').slice(0, 110)
  const initials = name.slice(0, 2).toUpperCase()
  const hasAvatar = !!(page.avatar_url && page.avatar_url.length > 4)

  const shell: any = {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '70px 90px',
    background: L.bgImage ? '#1B0D44' : L.bg,
  }
  if (L.bgImage) {
    shell.backgroundImage = 'url(' + L.bgImage + ')'
    shell.backgroundSize = '1200px 630px'
  }

  return new ImageResponse(
    (
      <div style={shell}>
        <div
          style={{
            width: 168, height: 168, borderRadius: 84, display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: hasAvatar ? 'transparent' : L.accentBg,
            color: L.accentText, fontSize: 62, fontWeight: 700,
          }}
        >
          {hasAvatar ? (
            <img src={page.avatar_url as string} width={168} height={168} style={{ objectFit: 'cover' }} alt="" />
          ) : (
            initials
          )}
        </div>

        <div
          style={{
            display: 'flex', justifyContent: 'center', marginTop: 34, width: 900,
            color: L.nameColor, fontSize: 62, fontWeight: 700,
            textAlign: 'center', lineHeight: 1.15, wordBreak: 'break-word',
          }}
        >
          {name}
        </div>

        {bio ? (
          <div
            style={{
              display: 'flex', justifyContent: 'center', marginTop: 18, width: 860,
              color: L.bioColor, fontSize: 28, textAlign: 'center',
              lineHeight: 1.4, wordBreak: 'break-word',
            }}
          >
            {bio}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 14, marginTop: 46,
            background: '#FFFFFF', color: '#1B0D44', borderRadius: 999,
            padding: '18px 34px', fontSize: 26, fontWeight: 700,
            maxWidth: 900, wordBreak: 'break-word',
          }}
        >
          <div style={{ display: 'flex', width: 26, height: 26, borderRadius: 8, background: '#7C5CE6' }} />
          relayme.bio/{page.username}
        </div>
      </div>
    ),
    { ...size, emoji: 'twemoji' }
  )
}
