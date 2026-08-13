import { Link } from '../../lib/supabase'
import { LinkButton } from './linkbutton'
import { EmbedCard } from './embedcard'
import { detectEmbed } from '../../lib/embed'

// Not every row on a page is a link. A heading names the group under it and a
// divider is a rule; both reorder and hide like anything else, so they share
// the same table and the same ordering, and only the rendering differs.
export function Row({ link, look }: { link: Link; look: any }) {
  if (link.kind === 'divider') {
    return (
      <hr
        style={{
          border: 'none', height: 1, margin: '10px 22px',
          background: look.bioColor, opacity: 0.28,
        }}
      />
    )
  }

  if (link.kind === 'heading') {
    return (
      <h2
        style={{
          margin: '14px 4px 2px', fontSize: 13, fontWeight: 800,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: look.bioColor, textAlign: 'center', lineHeight: 1.4,
          overflowWrap: 'anywhere',
        }}
      >
        {link.title}
      </h2>
    )
  }

  // an embeddable link plays where it stands; if the url stopped being
  // embeddable it quietly goes back to being a button
  if (link.embed_kind && detectEmbed(link.url)) {
    return <EmbedCard link={link} look={look} />
  }

  return <LinkButton link={link} look={look} />
}
