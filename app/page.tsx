import { Blob, Star, Robot, Bear, Rocket, Squiggle } from './blob'
import { SignupModal } from './signupmodal'
import { ClosedNotice } from './closednotice'
import { jsonLdScript } from '../lib/jsonld'

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://relayme.bio/#website',
        url: 'https://relayme.bio',
        name: 'Relay',
        description: 'One link for everything you make.',
        publisher: { '@id': 'https://relayme.bio/#org' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://relayme.bio/#org',
        name: 'ClearPath Advisory',
        url: 'https://relayme.bio',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ul. Micha\u0142a Kleofasa Ogi\u0144skiego 11 lok. 9',
          postalCode: '03-318',
          addressLocality: 'Warszawa',
          addressCountry: 'PL',
        },
        email: 'hello@relayme.bio',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Relay',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://relayme.bio',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
          { '@type': 'Offer', price: '30', priceCurrency: 'USD', name: 'Pro yearly' },
          { '@type': 'Offer', price: '4', priceCurrency: 'USD', name: 'Pro monthly' },
        ],
      },
    ],
  }

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <ClosedNotice />
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          <span style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</span>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <section className="hero">
          <span className="heroart">
            <Star color="#C6F15C" size={26} style={{ position: 'absolute', top: -12, left: '46%' }} />
            <Star color="#F0A2FD" size={17} style={{ position: 'absolute', bottom: 6, left: -8 }} />
            <Rocket size={40} className="rocketfly" style={{ position: 'absolute', top: 4, right: -6 }} />
            <Squiggle color="#C6F15C" size={54} style={{ position: 'absolute', bottom: -14, left: '38%' }} />
          </span>

          <div>
            <span style={{ display: 'inline-block', background: 'var(--lime)', color: 'var(--ink)', fontSize: 14, padding: '7px 16px', borderRadius: 10, fontWeight: 600 }}>
              one link. everything you make.
            </span>
            <h1 className="herotitle">
              Your bio deserves better than a sad grey link
            </h1>
            <p className="herosub">
              Build a page people actually want to tap. Unlimited links on every plan, your own photo, and a proper preview of every site you point to.
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/login" className="btn">Grab your name →</a>
              <span style={{ fontSize: 15, color: 'var(--muted)' }}>takes 40 seconds, honest</span>
              <span className="ctablob"><Blob size={86} /></span>
            </div>
          </div>

          <div className="heroblob"><Blob size={210} /></div>
        </section>

        <section style={{ marginTop: 80, position: 'relative' }}>
          <span className="heroart">
            <Robot size={46} className="robotbob" style={{ position: 'absolute', top: -34, right: 4 }} />
            <Squiggle color="#F0A2FD" size={48} style={{ position: 'absolute', top: -6, left: 178 }} />
          </span>
          <h2 className="sech">Simple pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div className="block block-plain">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Free</p>
              <p style={{ margin: '6px 0 12px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>$0</p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.7)' }}>Enough to publish a real page.</p>
              <ul className="feat">
                <li>Unlimited links</li>
                <li>Your own photo and bio</li>
                <li>A row of social icons</li>
                <li>Two themes, one font</li>
                <li>Automatic titles and icons</li>
                <li>Tap stats and a QR code</li>
              </ul>
            </div>

            <div className="block block-violet">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                Pro yearly <span style={{ background: 'var(--lime)', color: 'var(--ink)', fontSize: 12, padding: '3px 9px', borderRadius: 8, marginLeft: 6, fontWeight: 700 }}>best value</span>
              </p>
              <p style={{ margin: '6px 0 4px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>
                $30<span style={{ fontSize: 15, fontWeight: 600 }}>/year</span>
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 600, color: 'rgba(27,13,68,.6)' }}>
                $2.50 a month, billed once
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.75)' }}>Everything, and the cheapest way to get it.</p>
              <ul className="feat on-dark">
                <li>Everything in Free</li>
                <li>All forty themes, four of them doodles</li>
                <li>All eight fonts</li>
                <li>Your own colours, four slots</li>
                <li>Background image</li>
                <li>Remove the Relay badge from your page</li>
                <li>Try it all before you pay</li>
                <li><strong>Save $18 against monthly</strong></li>
                <li><strong>One payment, then nothing to think about for a year</strong></li>
                <li><strong>Your price is locked for the full twelve months</strong></li>
              </ul>
            </div>

            <div className="block block-sun">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Pro monthly</p>
              <p style={{ margin: '6px 0 4px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>
                $4<span style={{ fontSize: 15, fontWeight: 600 }}>/month</span>
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 600, color: 'rgba(27,13,68,.6)' }}>
                $48 across a year
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.75)' }}>The same Pro, paid in small pieces.</p>
              <ul className="feat on-dark">
                <li>Everything in Free</li>
                <li>All forty themes, four of them doodles</li>
                <li>All eight fonts</li>
                <li>Your own colours, four slots</li>
                <li>Background image</li>
                <li>Remove the Relay badge from your page</li>
                <li>Try it all before you pay</li>
                <li>Cancel any month you like</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 64, position: 'relative', background: '#F3F0FB', borderRadius: 26, padding: '30px 26px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', overflow: 'hidden' }}>
          <Rocket size={54} className="rocketfly" />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 24, margin: '0 0 6px', fontWeight: 800 }}>Try Pro without paying</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.7)' }}>
              Every theme, font and colour is switchable in the editor on a free account. Nothing saves until you subscribe — and when you do, the look you built is applied for you.
            </p>
          </div>
          <a href="/login" className="btn">Open the editor →</a>
          <span className="heroart">
            <Star color="#C6F15C" size={20} style={{ position: 'absolute', top: 14, right: 128 }} />
            <Squiggle color="#B0A0FF" size={44} style={{ position: 'absolute', bottom: 8, left: 92 }} />
          </span>
        </section>

        <footer style={{ marginTop: 60, fontSize: 14, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <Bear size={40} />
          <span>Relay is made by ClearPath Advisory.</span>
          <a href="/privacy" style={{ fontWeight: 600, color: 'var(--ink)' }}>Privacy</a>
          <a href="/terms" style={{ fontWeight: 600, color: 'var(--ink)' }}>Terms</a>
          <Star color="#F0A2FD" size={15} />
          <Squiggle color="#FEB591" size={40} style={{ marginLeft: 'auto' }} />
        </footer>
      </div>
      <SignupModal />
    </main>
  )
}
