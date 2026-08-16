import type { Metadata } from 'next'
import { Blob, Star, Squiggle } from '../blob'
import { jsonLdScript } from '../../lib/jsonld'

export const metadata: Metadata = {
  title: 'Relay next to Linktree',
  description:
    'An honest side-by-side: what Relay does, what it does not do yet, and who each one suits. Unlimited links on the free plan, 47 themes, no advertising.',
  alternates: { canonical: 'https://relayme.bio/vs-linktree' },
}

// Rows are written to be defensible. Claiming a competitor lacks something it
// has is the fastest way to lose the reader, and the honest gaps below do more
// for trust than another tick would. Tone drives the marker, not the wording:
// "yes" is a tick, "no" a dash, "soon" a dot.
type Tone = 'yes' | 'no' | 'soon'
const ROWS: { label: string; relay: string; rt: Tone; other: string; ot: Tone; ours?: boolean }[] = [
  { label: 'Links on the free plan', relay: 'Unlimited', rt: 'yes', other: 'Unlimited', ot: 'yes' },
  { label: 'Themes on the free plan', relay: '5, including a dark one', rt: 'yes', other: 'A small fixed set', ot: 'yes', ours: true },
  { label: 'Themes in total', relay: '47, including seasonal', rt: 'yes', other: 'Many, most behind a plan', ot: 'yes' },
  { label: 'Try paid styling before paying', relay: 'The whole editor', rt: 'yes', other: 'No', ot: 'no', ours: true },
  { label: 'Remove the maker\u2019s badge', relay: 'Included in Pro', rt: 'yes', other: 'Higher tier', ot: 'yes', ours: true },
  { label: 'Yearly price', relay: '$49.99 plus VAT', rt: 'yes', other: 'More on comparable tiers', ot: 'yes', ours: true },
  { label: 'Advertising on your page', relay: 'None, ever', rt: 'yes', other: 'None on paid tiers', ot: 'yes', ours: true },
  { label: 'Third-party fonts and trackers', relay: 'None \u2014 fonts self-hosted', rt: 'yes', other: 'Third-party requests present', ot: 'no', ours: true },
  { label: 'Where your data sits', relay: 'European Union', rt: 'yes', other: 'United States', ot: 'yes', ours: true },
  { label: 'Take your page offline without deleting', relay: 'Yes', rt: 'yes', other: 'Yes', ot: 'yes' },
  { label: 'Headings and dividers', relay: 'Free plan', rt: 'yes', other: 'Paid tiers', ot: 'yes', ours: true },
  { label: 'Story-sized image of your page', relay: 'Free plan', rt: 'yes', other: 'Paid tiers', ot: 'yes', ours: true },
  { label: 'Your own image on every link', relay: 'Included in Pro', rt: 'yes', other: 'Yes', ot: 'yes' },
  { label: 'Links on a schedule', relay: 'Included in Pro', rt: 'yes', other: 'Higher tier', ot: 'yes', ours: true },
  { label: 'Email capture', relay: 'Included in Pro, confirmed opt-in', rt: 'yes', other: 'Yes', ot: 'yes', ours: true },
  { label: 'Music and video embeds', relay: 'Included in Pro, click to play', rt: 'yes', other: 'Yes', ot: 'yes', ours: true },
  { label: 'Stickers on your page', relay: '81, included in Pro', rt: 'yes', other: 'Yes, free', ot: 'yes' },
  { label: 'Visitor countries', relay: 'Included in Pro', rt: 'yes', other: 'Higher tier', ot: 'yes', ours: true },
  { label: 'Export your own stats', relay: 'Included in Pro, spreadsheet file', rt: 'yes', other: 'Higher tier', ot: 'yes', ours: true },
  { label: 'Your own domain', relay: 'No', rt: 'no', other: 'Yes, on higher tiers', ot: 'yes' },
  { label: 'Payments and tipping', relay: 'No', rt: 'no', other: 'Yes', ot: 'yes' },
]

function Mark({ tone }: { tone: Tone }) {
  return <span className={'mark mark-' + tone} aria-hidden="true">{tone === 'yes' ? '✓' : tone === 'soon' ? '•' : '–'}</span>
}

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

        {/* One grid rather than two lists, so every row lines up across both
            columns. The Relay column carries the colour, which is what makes it
            read as the same kind of object as the pricing cards. */}
        <div className="cmp">
          <div className="cmpspacer" />
          <div className="cmphead cmpmine">
            <p className="cmpbrand">Relay</p>
            <p className="cmpprice">$49.99<span>/year</span></p>
            <p className="cmpnote">Or $8 a month, plus VAT. Free plan with no time limit.</p>
          </div>
          <div className="cmphead cmptheirs">
            <p className="cmpbrand">Linktree</p>
            <p className="cmpprice cmpprice-muted">More</p>
            <p className="cmpnote">The original, and a good product.</p>
          </div>

          {ROWS.map((r) => (
            <div key={r.label} className="cmprow">
              <div className="cmplabel">{r.label}</div>
              <div className={r.ours ? 'cmpcell cmpmine win' : 'cmpcell cmpmine'} data-side="Relay">
                <Mark tone={r.rt} />
                <span>{r.relay}</span>
              </div>
              <div className="cmpcell cmptheirs" data-side="Linktree">
                <Mark tone={r.ot} />
                <span>{r.other}</span>
              </div>
            </div>
          ))}

          <div className="cmpspacer" />
          <div className="cmpfoot cmpmine" />
          <div className="cmpfoot cmptheirs" />
        </div>

        <div className="legal" style={{ maxWidth: 760, marginTop: 44 }}>
          <h2>Who should pick which</h2>
          <p>
            <strong>Take Linktree</strong> if you need to sell or take tips straight from the page,
            or if you want your own domain in front of it. Those are real features and we do not
            have them.
          </p>
          <p>
            <strong>Take Relay</strong> if you want a page that looks made rather than generated, if
            you would rather try the paid styling before deciding, if $49.99 a year suits you
            better than the alternative, or if it matters to you that your visitors&rsquo; addresses
            are not handed to a font network and an analytics company on the way in.
          </p>

          <h2>The honest gaps</h2>
          <p>
            A custom domain is not planned for this year. Payments are not planned at all &mdash;
            taking money on behalf of other people is a regulated business and not one we intend to
            enter.
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
          <a href="/blog">Blog</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <span>Relay is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
