import { ImageResponse } from 'next/og'
import { serverClient, resolveLook, Page, Theme } from '../../../lib/supabase'

// Node rather than edge: the QR is generated with the same qrcode package the
// dashboard already uses, and that is not an edge-safe dependency.
export const runtime = 'nodejs'
export const revalidate = 3600

// A 1080x1920 image of the page, sized for an Instagram or TikTok story. It is
// the only feature here that markets Relay for someone else — every story
// posted is the badge in front of an audience that has never heard of us —
// which is why it is on the free plan.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const username = (url.searchParams.get('u') || '').toLowerCase().slice(0, 40)
  if (!username) return new Response('missing username', { status: 400 })

  const sb = serverClient()
  const { data: page } = await sb
    .from('pages')
    .select('*')
    .eq('username', username)
    .eq('is_published', true)
    .maybeSingle()

  if (!page) return new Response('not found', { status: 404 })

  const { data: theme } = await sb.from('themes').select('*').eq('id', page.theme_id).maybeSingle()
  const L = resolveLook(page as Page, theme as Theme)

  const name = page.display_name || page.username
  const bio = (page.bio || '').slice(0, 120)
  const initials = name.slice(0, 2).toUpperCase()
  const hasAvatar = !!(page.avatar_url && page.avatar_url.length > 4)

  // Rendered white-on-white so it reads on any theme, and encoded inline
  // because satori will not fetch a relative image.
  let qrDataUrl = ''
  try {
    const mod: any = await import('qrcode')
    qrDataUrl = await mod.toDataURL('https://relayme.bio/' + page.username, {
      width: 420, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#1B0D44', light: '#FFFFFF' },
    })
  } catch (e) {}

  const shell: any = {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '150px 90px',
    background: L.bgImage ? '#1B0D44' : L.bg,
  }
  if (L.bgImage) {
    shell.backgroundImage = 'url(' + L.bgImage + ')'
    shell.backgroundSize = '1080px 1920px'
  }

  return new ImageResponse(
    (
      <div style={shell}>
        <div
          style={{
            width: 260, height: 260, borderRadius: 130, display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: hasAvatar ? 'transparent' : L.accentBg,
            color: L.accentText, fontSize: 96, fontWeight: 700,
          }}
        >
          {hasAvatar ? (
            <img src={page.avatar_url as string} width={260} height={260} style={{ objectFit: 'cover' }} alt="" />
          ) : (
            initials
          )}
        </div>

        <div
          style={{
            display: 'flex', justifyContent: 'center', marginTop: 52, width: 880,
            color: L.nameColor, fontSize: 86, fontWeight: 700,
            textAlign: 'center', lineHeight: 1.12, wordBreak: 'break-word',
          }}
        >
          {name}
        </div>

        {bio ? (
          <div
            style={{
              display: 'flex', justifyContent: 'center', marginTop: 26, width: 820,
              color: L.bioColor, fontSize: 36, textAlign: 'center',
              lineHeight: 1.4, wordBreak: 'break-word',
            }}
          >
            {bio}
          </div>
        ) : null}

        {qrDataUrl ? (
          <div
            style={{
              display: 'flex', marginTop: 74, padding: 26,
              background: '#FFFFFF', borderRadius: 40,
            }}
          >
            <img src={qrDataUrl} width={340} height={340} alt="" />
          </div>
        ) : null}

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 18, marginTop: 46,
            background: '#FFFFFF', color: '#1B0D44', borderRadius: 999,
            padding: '24px 44px', fontSize: 38, fontWeight: 700,
            maxWidth: 900, wordBreak: 'break-word',
          }}
        >
          <div style={{ display: 'flex', width: 34, height: 34, borderRadius: 11, background: '#7C5CE6' }} />
          relayme.bio/{page.username}
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
