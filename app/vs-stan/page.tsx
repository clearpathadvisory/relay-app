import type { Metadata } from 'next'
import { Blob } from '../blob'
import { jsonLdScript } from '../../lib/jsonld'

export const metadata: Metadata = {
  title: 'RelayMe next to Stan Store',
  description:
    'An honest side-by-side: Stan Store sells, RelayMe presents. What each one does, what RelayMe does not do, and which suits you. Free plan, no time limit.',
  alternates: { canonical: 'https://relayme.bio/vs-stan' },
}

// Rows are written to be defensible. Claiming a competitor lacks something it
// has is the fastest way to lose the reader, and the honest gaps below do more
// for trust than another tick would. Tone drives the marker, not the wording:
// "yes" is a tick, "no" a dash, "soon" a dot.
//
// Stan's figures are from its own pricing page and blog, checked August 2026:
// Creator $29 a month or $300 a year, Creator Pro $99 a month or $948 a year,
// no free plan, a 14-day trial, and no platform fee on top of Stripe. If those
// change, change them here — a comparison page that goes stale is worse than
// no comparison page, because it reads as a lie rather than an oversight.
type Tone = 'yes' | 'no' | 'soon'
const ROWS: { label: string; relay: string; rt: Tone; other: string; ot: Tone; ours?: boolean }[] = [
  { label: 'Free plan', relay: 'Yes, no time limit', rt: 'yes', other: 'None \u2014 14-day trial', ot: 'no', ours: true },
  { label: 'Cheapest paid plan', relay: '$49.99 a year', rt: 'yes', other: '$300 a year, or $29 a month', ot: 'yes', ours: true },
  { label: 'Links on the free plan', relay: 'Unlimited', rt: 'yes', other: 'No free plan', ot: 'no', ours: true },
  { label: 'Sell digital products', relay: 'No', rt: 'no', other: 'Yes, with checkout', ot: 'yes' },
  { label: 'Sell courses', relay: 'No', rt: 'no', other: 'Yes, course builder', ot: 'yes' },
  { label: 'Take payments on the page', relay: 'No', rt: 'no', other: 'Yes, one-tap checkout', ot: 'yes' },
  { label: 'Booking calendar on the page', relay: 'Cal.com, Calendly, Google \u2014 free plan', rt: 'yes', other: 'Yes, built in', ot: 'yes' },
  { label: 'Paid bookings', relay: 'Through Calendly, which takes the money', rt: 'soon', other: 'Yes, built in', ot: 'yes' },
  { label: 'Music that plays on the page', relay: '9 services, in Pro', rt: 'yes', other: 'No', ot: 'no', ours: true },
  { label: 'Video that plays on the page', relay: 'YouTube, in Pro', rt: 'yes', other: 'No', ot: 'no', ours: true },
  { label: 'Themes', relay: '47, five on the free plan', rt: 'yes', other: 'A fixed look', ot: 'no', ours: true },
  { label: 'Stickers on your page', relay: '94, included in Pro', rt: 'yes', other: 'No', ot: 'no', ours: true },
  { label: 'Try the paid styling before paying', relay: 'The whole editor', rt: 'yes', other: 'Card-free 14-day trial', ot: 'yes' },
  { label: 'Email capture', relay: 'Included in Pro, confirmed opt-in', rt: 'yes', other: 'Yes', ot: 'yes' },
  { label: 'Email marketing and automations', relay: 'No', rt: 'no', other: 'On the $99 plan', ot: 'yes' },
  { label: 'Upsells, funnels, affiliates', relay: 'No', rt: 'no', other: 'On the $99 plan', ot: 'yes' },
  { label: 'Your own domain', relay: 'No', rt: 'no', other: 'No', ot: 'no' },
  { label: 'Platform cut of your sales', relay: 'Nothing to cut', rt: 'yes', other: 'None beyond card processing', ot: 'yes' },
  { label: 'Where your data sits', relay: 'European Union', rt: 'yes', other: 'United States', ot: 'yes', ours: true },
  { label: 'Advertising on your page', relay: 'None, ever', rt: 'yes', other: 'None', ot: 'yes' },
]

function Mark({ tone }: { tone: Tone }) {
  return <span className={'mark mark-' + tone} aria-hidden="true">{tone === 'yes' ? '✓' : tone === 'soon' ? '•' : '–'}</span>
}

export default function VsStan() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'RelayMe next to Stan Store',
    description: 'A side-by-side comparison of RelayMe and Stan Store, including what RelayMe does not do.',
    author: { '@type': 'Organization', name: 'ClearPath Advisory' },
    publisher: { '@type': 'Organization', name: 'ClearPath Advisory' },
    mainEntityOfPage: 'https://relayme.bio/vs-stan',
  }

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <a href="/" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>RelayMe</a>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <div className="legal" style={{ maxWidth: 760 }}>
          <p className="legalkicker">Comparison</p>
          <h1>RelayMe next to Stan Store</h1>
          <p className="legallede">
            These are not really the same product, and the most useful thing we can tell you is
            which problem each one solves. Stan Store is a shop. RelayMe is a page. If you sell
            courses for a living, the rest of this will point you at Stan &mdash; and it should.
          </p>
        </div>

        {/* One grid rather than two lists, so every row lines up across both
            columns. The RelayMe column carries the colour, which is what makes it
            read as the same kind of object as the pricing cards. */}
        <div className="cmp">
          <div className="cmpspacer" />
          <div className="cmphead cmpmine">
            <p className="cmpbrand">RelayMe</p>
            <p className="cmpprice">$49.99<span>/year</span></p>
            <p className="cmpnote">Or $8 a month, plus VAT. Free plan with no time limit.</p>
          </div>
          <div className="cmphead cmptheirs">
            <p className="cmpbrand">Stan Store</p>
            <p className="cmpprice cmpprice-muted">$300<span>/year</span></p>
            <p className="cmpnote">Creator plan. Pro is $948. No free plan, 14-day trial.</p>
          </div>

          {ROWS.map((r) => (
            <div key={r.label} className="cmprow">
              <div className="cmplabel">{r.label}</div>
              <div className={r.ours ? 'cmpcell cmpmine win' : 'cmpcell cmpmine'} data-side="RelayMe">
                <Mark tone={r.rt} />
                <span>{r.relay}</span>
              </div>
              <div className="cmpcell cmptheirs" data-side="Stan Store">
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
            <strong>Take Stan Store</strong> if selling is the point. Courses, digital downloads,
            coaching packages, subscriptions &mdash; it has a real checkout, it delivers the file,
            and it takes no cut beyond what the card network charges. If that is your income, $29 a
            month is not expensive, and nothing on this page should talk you out of it.
          </p>
          <p>
            <strong>Take RelayMe</strong> if what you have is work rather than products. Music that
            should play where somebody found it. A page that looks made rather than generated. A
            free plan that stays free, because you are not sure yet whether any of this earns.
          </p>
          <p>
            The clearest difference is what happens when somebody taps. On a store, they buy. On a
            RelayMe page, they listen &mdash; nine services play in place, so a visitor hears the
            track without being handed to another app and losing their way back.
          </p>

          <h2>The part where the two overlap</h2>
          <p>
            Bookings. Stan has a calendar with payment built in. RelayMe embeds Cal.com, Calendly or
            a Google appointment page, and that is on the free plan. Where the booking itself is
            paid, Calendly takes the money on its own side &mdash; so a paid consultation runs
            through a free RelayMe page without us handling a penny of it.
          </p>
          <p>
            That is a real answer for a coach or a consultant taking calls, and it costs nothing.
            It is not an answer for someone selling forty ebooks a month.
          </p>

          <h2>The honest gaps</h2>
          <p>
            We do not sell anything for you, and we do not intend to. Handling money on behalf of
            other people is a regulated business, and entering it badly is worse than staying out.
            There is no email marketing, no upsells, no affiliate scheme, and no custom domain
            &mdash; Stan does not have custom domains either, but that is not much of a defence.
          </p>
          <p>
            If your bio link is a shopfront, Stan is built for that and we are not.
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
          <a href="/vs-linktree">Next to Linktree</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <span>RelayMe is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
