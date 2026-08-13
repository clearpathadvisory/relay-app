import type { Metadata } from 'next'
import { Blob, Star, Squiggle } from '../blob'
import { jsonLdScript } from '../../lib/jsonld'

export const metadata: Metadata = {
  title: 'Relay next to Linktree',
  description:
    'An honest side-by-side: what Relay does, what it does not do yet, and who each one suits. Unlimited links on the free plan, forty themes, no advertising.',
  alternates: { canonical: 'https://relayme.bio/vs-linktree' },
}

// Rows are written to be defensible. Claiming a competitor lacks something it
// has is the fastest way to lose the reader, and the honest gaps below do more
// for trust than another tick would.
const ROWS: { label: string; relay: string; other: string; ours: boolean }[] = [
  { label: 'Links on the free plan', relay: 'Unlimited', other: 'Unlimited', ours: false },
  { label: 'Themes on the free plan', relay: 'Five, including a dark one', other: 'A small fixed set', ours: true },
  { label: 'Themes in total', relay: 'Forty, four of them doodle backgrounds', other: 'Many, most behind a plan', ours: false },
  { label: 'Try paid styling before paying', relay: 'Yes, the whole editor', other: 'No', ours: true },
  { label: 'Remove the maker\u2019s badge', relay: 'Included in Pro', other: 'Higher tier', ours: true },
  { label: 'Yearly price', relay: '$30', other: 'Higher on comparable tiers', ours: true },
  { label: 'Advertising on your page', relay: 'None, ever', other: 'None on paid tiers', ours: true },
  { label: 'Third-party fonts and trackers', relay: 'None \u2014 fonts self-hosted', other: 'Third-party requests present', ours: true },
  { label: 'Where your data sits', relay: 'European Union', other: 'United States', ours: true },
  { label: 'Take your page offline without deleting', relay: 'Yes', other: 'Yes', ours: false },
  { label: 'Email capture', relay: 'Not yet \u2014 in build', other: 'Yes', ours: false },
  { label: 'Music and video embeds', relay: 'Not yet \u2014 in build', other: 'Yes', ours: false },
  { label: 'Your own domain', relay: 'No', other: 'Yes, on higher tiers', ours: false },
  { label: 'Payments and tipping on your page', relay: 'No', other: 'Yes', ours: false },
]

export default function VsLinktree() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Relay next to Linktree',
    description: 'A side-by-side comparison of Relay and Linktree, including what Relay does not do.',
    author: { '@type': 'Organization', name: 'ClearPath Advisory' },
    publisher: { '@type': 'Organization', name: 'ClearPath Advisory' },
    mainEntityOfPage: 'https://relayme.bio/vs-linktree',
  }

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <a href="/" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</a>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <div className="legal" style={{ maxWidth: 760 }}>
          <p className="legalkicker">Comparison</p>
          <h1>Relay next to Linktree</h1>
          <p className="legallede">
            Linktree invented this category and it is a good product. Relay is smaller, cheaper and
            more private, and there are things it does not do yet. All of that is below, including
            the parts that do not flatter us.
          </p>
        </div>

        <div className="cmpwrap">
          <table className="cmp">
            <thead>
              <tr>
                <th></th>
                <th className="cmpus">Relay</th>
                <th>Linktree</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td className="cmplabel">{r.label}</td>
                  <td className={r.ours ? 'cmpus cmpwin' : 'cmpus'}>{r.relay}</td>
                  <td>{r.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="legal" style={{ maxWidth: 760, marginTop: 44 }}>
          <h2>Who should pick which</h2>
          <p>
            <strong>Take Linktree</strong> if you need to sell or take tips straight from the page,
            if embedded players are the point of your page, or if you want your own domain in front
            of it. Those are real features and we do not have them yet.
          </p>
          <p>
            <strong>Take Relay</strong> if you want a page that looks made rather than generated, if
            you would rather try the paid styling before deciding, if thirty dollars a year suits you
            better than the alternative, or if it matters to you that your visitors&rsquo; addresses
            are not handed to a font network and an analytics company on the way in.
          </p>

          <h2>The honest gaps</h2>
          <p>
            Email capture and embeds are being built and will arrive on Pro. A custom domain is not
            planned for this year. Payments are not planned at all &mdash; taking money on behalf of
            other people is a regulated business and not one we intend to enter.
          </p>

          <div className="legalend">
            <Blob size={92} />
            <p>
              Nothing here is a limited trial. Claim a name, build a page, and decide afterwards.
              <br />
              <a href="/login" className="btn" style={{ marginTop: 14, display: 'inline-block' }}>Grab your name →</a>
            </p>
          </div>
        </div>

        <footer className="legalfoot">
          <a href="/">Home</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <span>Relay is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
