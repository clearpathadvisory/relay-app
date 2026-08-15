import { serverClient, Theme, Link, Page, Social, resolveLook } from '../../lib/supabase'
import { SocialIcon, socialHref, socialName } from '../socialicons'
import { Blob } from '../blob'
import { Row } from './row'
import { Capture } from './capture'
import { ShareButton } from './sharebutton'
import { PageView } from './pageview'
import { redirect } from 'next/navigation'
import { jsonLdScript } from '../../lib/jsonld'
import type { Metadata } from 'next'

export const revalidate = 60

async function load(username: string) {
  const sb = serverClient()
  const { data: page } = await sb.from('pages').select('*').eq('username', username).eq('is_published', true).maybeSingle()
  if (!page) return null
  // A scheduled link is filtered out here rather than rendered and hidden, so
  // it never reaches the visitor's browser at all. The page is cached for a
  // minute, so a window opens within about a minute of its time — which is what
  // the editor tells the owner.
  const nowIso = new Date().toISOString()
  const { data: links } = await sb
    .from('links')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_active', true)
    .or('starts_at.is.null,starts_at.lte.' + nowIso)
    .or('ends_at.is.null,ends_at.gt.' + nowIso)
    .order('position')
  const { data: theme } = await sb.from('themes').select('*').eq('id', page.theme_id).maybeSingle()
  const { data: socials } = await sb.from('socials').select('*').eq('page_id', page.id).order('position')
  return { page: page as Page, links: (links || []) as Link[], theme: theme as Theme, socials: (socials || []) as Social[] }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const data = await load(decodeURIComponent(params.username).toLowerCase())
  if (!data) return { title: 'Not found', robots: { index: false, follow: false } }
  const name = data.page.display_name || data.page.username
  // The owner's own words win over the generated fallback, for the tab, the
  // search result and the share card alike.
  const title = (data.page as any).seo_title || name
  const desc = (data.page as any).seo_desc || data.page.bio || ('Links from ' + name)
  return {
    // No ' — Relay' suffix here. The root layout sets a title template of
    // '%s — Relay', which Next applies to every page title automatically.
    // Appending it here too produced 'name — Relay — Relay' in the tab, in
    // search results, and in the text of any shared link.
    title: title,
    description: desc,
    openGraph: {
      title: title,
      description: desc,
      url: 'https://relayme.bio/' + data.page.username,
      siteName: 'Relay',
      type: 'profile',
    },
    twitter: { card: 'summary_large_image', title: title, description: desc },
    alternates: { canonical: 'https://relayme.bio/' + data.page.username },
  }
}

export default async function PublicPage({ params }: { params: { username: string } }) {
  // Usernames are stored lowercase. Serving /Mira and /mira both at 200 splits
  // the same page across two URLs; a permanent redirect keeps one of each.
  const raw = decodeURIComponent(params.username)
  const lower = raw.toLowerCase()
  if (raw !== lower) redirect('/' + lower)

  const data = await load(lower)

  if (!data) {
    return (
      <main className="centre">
        <Blob size={140} mood="sad" />
        <h1 style={{ fontSize: 28, margin: '10px 0 6px' }}>No page here</h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>The blob checked twice.</p>
        <a href="/" className="btn" style={{ marginTop: 18 }}>Claim this name →</a>
      </main>
    )
  }

  const { page, links, theme, socials } = data
  const L = resolveLook(page, theme)
  const initials = (page.display_name || page.username).slice(0, 2).toUpperCase()
  const hasAvatar = !!(page.avatar_url && page.avatar_url.length > 4)
  const wrap: any = { overflowWrap: 'anywhere', wordBreak: 'break-word' }

  // A tiled theme repeats at its own size; a flat colour or gradient covers.
  // The two must not be treated alike — cover over a 150px doodle tile blows
  // one doodle up to fill the whole screen.
  const fill = L.bgTiled ? {} : { backgroundSize: 'cover' }

  // the page behind the card
  const shell: any = { background: L.bg, ...fill, fontFamily: L.font }
  // the card itself carries the same look, so it reads as one surface with an edge
  const card: any = { background: L.bg, ...fill }
  if (L.bgImage) {
    for (const o of [shell, card]) {
      o.backgroundImage = 'url(' + L.bgImage + ')'
      o.backgroundSize = 'cover'
      o.backgroundPosition = 'center'
    }
    shell.backgroundAttachment = 'fixed'
  }

  const av: any = {
    width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
    margin: '0 auto 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 30, fontWeight: 700, flexShrink: 0,
  }
  if (!hasAvatar) { av.backgroundColor = L.accentBg; av.color = L.accentText }

  const sameAs = socials
    .map((sc) => socialHref(sc.platform, sc.url))
    .filter((u) => u.indexOf('http') === 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateModified: (page as any).updated_at || undefined,
    mainEntity: {
      '@type': 'Person',
      name: page.display_name || page.username,
      alternateName: page.username,
      description: page.bio || undefined,
      image: page.avatar_url || undefined,
      url: 'https://relayme.bio/' + page.username,
      sameAs: sameAs.length ? sameAs : undefined,
    },
  }

  return (
    <main className="pubwrap" style={shell}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <PageView pageId={page.id} />
      <div className="pubcard" style={card}>
        <div className="pubinner">
          <ShareButton username={page.username} name={page.display_name || page.username} color={L.nameColor} />
        <div style={av}>
          {hasAvatar ? <img src={page.avatar_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>

        <h1 style={{ textAlign: 'center', fontSize: 23, margin: 0, color: L.nameColor, ...wrap }}>
          {page.display_name || page.username}
        </h1>
        {page.bio && (
          <p style={{ textAlign: 'center', fontSize: 15, margin: '10px 0 0', color: L.bioColor, lineHeight: 1.55, whiteSpace: 'pre-wrap', ...wrap }}>{page.bio}</p>
        )}

        {socials.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
            {socials.map((sc) => (
              <a key={sc.id} href={socialHref(sc.platform, sc.url)} target="_blank" rel="noopener noreferrer"
                aria-label={socialName(sc.platform)} title={socialName(sc.platform)}
                style={{ display: 'inline-flex', padding: 7 }}>
                {/* 30px glyph in a 44px tap target: 30 + 7 padding either side.
                    Was 24 in a 32px target, which both read small next to the
                    link cards and sat under the 44px touch minimum. The gap
                    drops from 18 to 14 so the row keeps its original width. */}
                <SocialIcon id={sc.platform} color={L.iconColor} size={30} />
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
          {links.map((l) => <Row key={l.id} link={l} look={L} />)}

          {page.capture_on && (
            <Capture
              pageId={page.id}
              heading={page.capture_heading}
              button={page.capture_button}
              note={page.capture_note}
              look={L}
            />
          )}
          {links.length === 0 && (
            <p style={{ textAlign: 'center', color: L.bioColor, fontSize: 14 }}>Nothing to relay yet.</p>
          )}
        </div>

          {page.show_branding !== false && (
            <div style={{ marginTop: 44, textAlign: 'center' }}>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#FFFFFF', color: '#1B0D44', padding: '13px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: '#7C5CE6', display: 'inline-block' }} />
                Join {page.username} on Relay
              </a>
            </div>
          )}

          <div className="publegal" style={{ color: L.bioColor }}>
            <a href="/privacy" style={{ color: L.bioColor }}>Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms" style={{ color: L.bioColor }}>Terms</a>
            <span aria-hidden="true">·</span>
            <a href="/" style={{ color: L.bioColor }}>Made with Relay</a>
          </div>
        </div>
      </div>
    </main>
  )
}
