import { ImageResponse } from 'next/og'
import { getPost, coverLook } from '../../../../lib/blog'
import { cardText } from '../../../../lib/cardtext'

// Edge, and with no caching directive declared. Both force-dynamic and
// revalidate = 0 turned the profile card blank in production; the route that
// works declares neither and sets its own header instead.
export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) return new Response('Not found', { status: 404 })

  const look = coverLook(post.cover_variant)
  // Satori draws nothing at all for emoji, so a title carrying one would come
  // back as an empty card rather than an error.
  const title = cardText(post.title, 'Relay')
  const category = cardText(post.category, 'Relay')

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: look.bg, padding: '68px 76px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', width: 40, height: 40, borderRadius: 13, background: look.accent }} />
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: look.ink }}>Relay</div>
          </div>
          <div
            style={{
              display: 'flex', background: look.chip, color: look.chipInk, borderRadius: 999,
              padding: '10px 24px', fontSize: 22, fontWeight: 700,
            }}
          >
            {category}
          </div>
        </div>

        <div
          style={{
            display: 'flex', fontSize: title.length > 74 ? 58 : 70, fontWeight: 700,
            color: look.ink, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 1010,
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', width: 120, height: 8, borderRadius: 99, background: look.accent }} />
          <div style={{ display: 'flex', fontSize: 24, color: look.ink, opacity: 0.72 }}>relayme.bio</div>
        </div>
      </div>
    ),
    { ...SIZE }
  )

  // Long enough that a crawler is not regenerating it, short enough that a
  // retitled post is corrected the same day.
  const headers = new Headers(image.headers)
  headers.set('cache-control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
  return new Response(image.body, { status: 200, headers })
}
