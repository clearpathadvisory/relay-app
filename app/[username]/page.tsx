import { serverClient, Theme, Link, Page, Social, resolveLook } from '../../lib/supabase'
import { SocialIcon, socialHref, socialName } from '../socialicons'
import { Blob } from '../blob'
import { LinkButton } from './linkbutton'
import type { Metadata } from 'next'

export const revalidate = 60

async function load(username: string) {
  const sb = serverClient()
  const { data: page } = await sb.from('pages').select('*').eq('username', username).eq('is_published', true).maybeSingle()
  if (!page) return null
  const { data: links } = await sb.from('links').select('*').eq('page_id', page.id).eq('is_active', true).order('position')
  const { data: theme } = await sb.from('themes').select('*').eq('id', page.theme_id).maybeSingle()
  const { data: socials } = await sb.from('socials').select('*').eq('page_id', page.id).order('position')
  return { page: page as Page, links: (links || []) as Link[], theme: theme as Theme, socials: (socials || []) as Social[] }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const data = await load(decodeURIComponent(params.username).toLowerCase())
  if (!data) return { title: 'Not found — Relay' }
  const name = data.page.display_name || data.page.username
  return {
    title: name + ' — Relay',
    description: data.page.bio || ('Links from ' + name),
    openGraph: { title: name, description: data.page.bio || '' },
  }
}

export default async function PublicPage({ params }: { params: { username: string } }) {
  const data = await load(decodeURIComponent(params.username).toLowerCase())

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

  // the page behind the card
  const shell: any = { background: L.bg, backgroundSize: 'cover', fontFamily: L.font }
  // the card itself carries the same look, so it reads as one surface with an edge
  const card: any = { background: L.bg, backgroundSize: 'cover' }
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

  return (
    <main className="pubwrap" style={shell}>
      <div className="pubcard" style={card}>
        <div className="pubinner">
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', marginTop: 18 }}>
            {socials.map((sc) => (
              <a key={sc.id} href={socialHref(sc.platform, sc.url)} target="_blank" rel="noopener noreferrer"
                aria-label={socialName(sc.platform)} title={socialName(sc.platform)}
                style={{ display: 'inline-flex', padding: 4 }}>
                <SocialIcon id={sc.platform} color={L.iconColor} size={24} />
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
          {links.map((l) => <LinkButton key={l.id} link={l} look={L} />)}
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
