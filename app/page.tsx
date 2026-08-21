import { Blob, Star, Robot, Bear, Rocket, Squiggle, LinkDoodle, Sparkles, Heart, Bolt, Tag } from './blob'
import { SignupModal } from './signupmodal'
import { ClosedNotice } from './closednotice'
import { jsonLdScript } from '../lib/jsonld'
import { HeroMock } from './heromock'
import { FAQS } from './faq'
import { Testimonials } from './trust'
import { SocialIcon } from './socialicons'

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://relayme.bio/#website',
        url: 'https://relayme.bio',
        name: 'RelayMe',
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
        // sameAs is how a search engine confirms these accounts are officially
        // ours rather than fan or impostor pages. Keep this list matching the
        // links in the footer.
        sameAs: [
          'https://www.instagram.com/relayme.bio/',
          'https://www.youtube.com/channel/UCeoO3M3YyC9fnG-P5_egtXw',
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://relayme.bio/#faq',
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'SoftwareApplication',
        name: 'RelayMe',
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
          <span style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>RelayMe</span>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <section className="hero">
          <span className="heroart">
            <Star color="#C6F15C" size={26} style={{ position: 'absolute', top: -12, left: '46%' }} />
            <Star color="#F0A2FD" size={17} style={{ position: 'absolute', bottom: 6, left: -8 }} />
            <Squiggle color="#C6F15C" size={54} style={{ position: 'absolute', bottom: -14, left: '38%' }} />
          </span>

          {/* Sets off from beside the mascot, climbs across the page and
              arrives under Sign in. The eye follows a moving thing, so the
              journey is the instruction. */}
          <span className="flight" aria-hidden="true">
            <Rocket size={44} />
          </span>

          <div>
            <span style={{ display: 'inline-block', background: 'var(--lime)', color: 'var(--ink)', fontSize: 14, padding: '7px 16px', borderRadius: 10, fontWeight: 600 }}>
              one link. everything you make.
            </span>
            <h1 className="herotitle">
              Your bio deserves better than a sad grey link
            </h1>
            <p className="herosub">
              Build a page people actually want to tap. Music and video play where they sit, a booking
              calendar opens without sending anyone away, and unlimited links come on every plan.
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/login" className="btn">Grab your name →</a>
              <span style={{ fontSize: 15, color: 'var(--muted)' }}>takes 40 seconds, honest</span>
              <span className="ctablob"><Blob size={96} /></span>
            </div>
          </div>

          <div className="heroblob"><HeroMock /></div>
        </section>

        <section style={{ marginTop: 80, position: 'relative' }}>
          {/* The pricing section ran 938px with no doodles at all — the one
              long stretch of the page where the personality dropped out.
              These sit in the margins and above the heading, never over the
              cards themselves: that is where someone is comparing prices. */}
          <span className="heroart">
            <Squiggle color="#F0A2FD" size={48} style={{ position: 'absolute', top: -6, left: 178 }} />
            <Star color="#B0A0FF" size={22} style={{ position: 'absolute', top: -22, right: 18 }} />
            <Tag size={34} style={{ position: 'absolute', top: 4, right: 62 }} />
            <Sparkles size={32} style={{ position: 'absolute', top: 360, left: -46 }} />
            <Squiggle color="#C6F15C" size={44} style={{ position: 'absolute', bottom: -26, right: 120 }} />
          </span>
          <h2 className="sech">Simple pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div className="block block-plain plan">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Free</p>
              <p style={{ margin: '6px 0 12px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>$0</p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.7)' }}>Enough to publish a real page.</p>
              <ul className="feat">
                <li>Unlimited links</li>
                <li>A booking calendar on your page &mdash; Cal.com, Calendly or Google</li>
                <li>Your own photo and bio</li>
                <li>A row of social icons</li>
                <li>5 themes, 1 font</li>
                <li>Headings and dividers to group your links</li>
                <li>A story-sized image of your page, ready to post</li>
                <li>Automatic titles and icons</li>
                <li>Tap stats and a QR code</li>
              </ul>
              <div className="plancta">
                <a href="/login" className="btn ghost">Start free →</a>
                <p className="plannote">No card needed.</p>
              </div>
            </div>

            <div className="block block-violet plan">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                Pro yearly <span style={{ background: 'var(--lime)', color: 'var(--ink)', fontSize: 12, padding: '3px 9px', borderRadius: 8, marginLeft: 6, fontWeight: 700 }}>best value</span>
              </p>
              <p style={{ margin: '6px 0 4px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>
                $49.99<span style={{ fontSize: 15, fontWeight: 600 }}>/year</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}> + VAT</span>
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 600, color: 'rgba(27,13,68,.6)' }}>
                $4.17 a month, billed once. VAT added at checkout.
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.75)' }}>Everything, and the cheapest way to get it.</p>
              <ul className="feat on-dark">
                <li>Everything in Free</li>
                <li>All 47 themes, including seasonal</li>
                <li>All 8 fonts</li>
                <li>Your own colours, 4 slots</li>
                <li>Background image</li>
                <li>Your own image on every link</li>
                <li>Links that appear and disappear on a schedule</li>
                <li>Music and video that plays on your page &mdash; 9 services, from Spotify and YouTube to TIDAL, Deezer, Mixcloud and Audiomack</li>
                <li>Collect email addresses, and take the list with you</li>
                <li>94 stickers to decorate your page</li>
                <li>Which countries your visitors come from</li>
                <li>Download your stats as a spreadsheet</li>
                <li>Remove the RelayMe badge from your page</li>
                <li>Try it all before you pay</li>
                <li><strong>Save $46 against monthly</strong></li>
                <li><strong>1 payment, then nothing to think about for 12 months</strong></li>
                <li><strong>Your price is locked for the full 12 months</strong></li>
              </ul>
              <div className="plancta">
                <a href="/login" className="btn">Get Pro yearly →</a>
                <p className="plannote">Build it free first, pay when you like it.</p>
              </div>
            </div>

            <div className="block block-sun plan">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Pro monthly</p>
              <p style={{ margin: '6px 0 4px', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>
                $8<span style={{ fontSize: 15, fontWeight: 600 }}>/month</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}> + VAT</span>
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 600, color: 'rgba(27,13,68,.6)' }}>
                $96 across a year. VAT added at checkout.
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'rgba(27,13,68,.75)' }}>The same Pro, paid in small pieces.</p>
              <ul className="feat on-dark">
                <li>Everything in Free</li>
                <li>All 47 themes, including seasonal</li>
                <li>All 8 fonts</li>
                <li>Your own colours, 4 slots</li>
                <li>Background image</li>
                <li>Your own image on every link</li>
                <li>Links that appear and disappear on a schedule</li>
                <li>Music and video that plays on your page &mdash; 9 services, from Spotify and YouTube to TIDAL, Deezer, Mixcloud and Audiomack</li>
                <li>Collect email addresses, and take the list with you</li>
                <li>94 stickers to decorate your page</li>
                <li>Which countries your visitors come from</li>
                <li>Download your stats as a spreadsheet</li>
                <li>Remove the RelayMe badge from your page</li>
                <li>Try it all before you pay</li>
                <li>Cancel any month you like</li>
              </ul>
              <div className="plancta">
                <a href="/login" className="btn">Get Pro monthly →</a>
                <p className="plannote">Cancel any month, no email required.</p>
              </div>
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

        <Testimonials />

        <section style={{ marginTop: 72, position: 'relative' }}>
          <span className="heroart">
            <Star color="#C6F15C" size={20} style={{ position: 'absolute', top: -14, right: 40 }} />
          </span>
          {/* free to roam the whole block rather than pinned to a corner */}
          <span className="wander" aria-hidden="true"><Robot size={48} /></span>
          <h2 className="sech">Questions people actually ask</h2>
          <div className="faqgrid">
            {FAQS.map((f) => (
              <details key={f.q} className="faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 15, color: 'rgba(27,13,68,.7)' }}>
            Coming from somewhere else?{' '}
            <a href="/vs-linktree" style={{ color: 'var(--violet)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>RelayMe next to Linktree</a>
            {' '}or{' '}
            <a href="/vs-stan" style={{ color: 'var(--violet)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>next to Stan Store</a>.
          </p>
        </section>

        {/* Closing CTA. Before this, the last button on the page sat at
            y=1747 of 3381 — the testimonials, the whole FAQ and the footer
            had nothing to click. A reader who works through twelve answers
            is the warmest visitor on the page and was being handed a
            footer. */}
        <section className="endcta">
          <span className="heroart">
            <Bolt size={30} style={{ position: 'absolute', top: 30, left: 46 }} />
            <Star color="#B0A0FF" size={22} style={{ position: 'absolute', bottom: 34, right: 58 }} />
          </span>
          <h2 className="endctah">Ready when you are</h2>
          <p className="endctap">
            Claim your name, add your links, and see the page before you decide anything. Free, and about 40 seconds.
          </p>
          <a href="/login" className="btn">Grab your name →</a>
        </section>

        {/* Footer. Two rows on a phone, one on a laptop: the credit and page
            links sit left, the social marks right. The socials are our own
            accounts, so they open in a new tab and carry rel="me" — which is
            the standard way of saying "this profile belongs to this site". */}
        <footer className="homefoot">
          <div className="homefootl">
            {/* Credit and links are separate groups so they can stack as two
                tidy centred rows on a phone instead of the links wrapping
                mid-sentence after "ClearPath Advisory." */}
            <span className="footcredit">
              <Bear size={40} />
              <span>RelayMe is made by ClearPath Advisory.</span>
            </span>
            <span className="footlinks">
              <a href="/blog">Blog</a>
              {/* Both comparisons in the footer as well as under the FAQ. A
                  reader still shortlisting scrolls to the bottom looking for
                  exactly this, and the two pages are the only ones on the site
                  written for somebody who has not decided yet. */}
              <a href="/vs-linktree">vs Linktree</a>
              <a href="/vs-stan">vs Stan</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <Star color="#F0A2FD" size={15} />
            </span>
          </div>
          <div className="homefootr">
            <a href="https://www.instagram.com/relayme.bio/" target="_blank" rel="me noopener noreferrer"
              aria-label="RelayMe on Instagram" title="RelayMe on Instagram" className="footsoc">
              <SocialIcon id="instagram" color="currentColor" size={22} />
            </a>
            <a href="https://www.youtube.com/channel/UCeoO3M3YyC9fnG-P5_egtXw" target="_blank" rel="me noopener noreferrer"
              aria-label="RelayMe on YouTube" title="RelayMe on YouTube" className="footsoc">
              <SocialIcon id="youtube" color="currentColor" size={22} />
            </a>
            <Squiggle color="#FEB591" size={40} />
          </div>
        </footer>
      </div>
      <SignupModal />
    </main>
  )
}
