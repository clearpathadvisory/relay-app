// The strongest thing RelayMe has is what a finished page looks like, so the
// homepage shows one. This is relayme.bio's OWN page — the same name, bio,
// headings and links that are live right now, in the same Aurora theme.
//
// It was a made-up musician until someone pointed out the obvious: a visitor
// deciding whether to sign up would rather see a real page than a persona. If
// the live page changes shape, change it here too — an out-of-date hero is
// worse than an invented one, because it claims to be true.
//
// The device is a photograph of a hand holding a phone; the SCREEN is markup,
// drawn live inside it. That split is the whole point:
//
//   - the screen stays sharp at any density, costs no image request, and can
//     be read at 162px, which a downscaled screenshot cannot: the page is
//     authored at 430px, so its 15px body text would land at about 5.7px here
//   - the hand brings realism a drawn phone cannot, because skin, shadow and
//     the way fingers wrap a case are not things CSS does convincingly
//
// The photo is keyed so its screen area is transparent, which is why the page
// underneath shows through rather than being pasted on top: the fingers still
// overlap the case exactly as they do in the original.
//
// The source is 480x770 and is served at 2x, so it is doing more work than it
// was scanned for. Skin and shadow carry that better than text would — the
// other reason the screen is not part of the image. If a larger original ever
// turns up, replace public/hand.webp and change nothing else.

// The screen's position inside the photo (42.083% / 20.779%, 45% x 61.039%)
// and its 216px design width both live in globals.css, on .handscreen and
// .handscreeninner. They were measured from the keyed file, not guessed.

type Row =
  | { head: string }
  | { title: string; sub?: string; primary?: boolean }

export function HeroMock() {
  // Aurora, sampled off the live page rather than eyeballed: lime on the left
  // running to pink on the right, over a near-white ground.
  const T = {
    bg: 'linear-gradient(112deg, #CEF176 0%, #E3E0B5 42%, #F1AAFD 100%)',
    buttonBg: '#FFFFFF',
    buttonText: '#1B0D44',
    accentBg: '#1B0D44',
    accentText: '#C6F15C',
    nameColor: '#1B0D44',
    bioColor: '#4B406A',
    headColor: '#4B406A',
  }

  // The live page, in order. Trimmed at the point the screen runs out — what
  // is here is real, it simply stops rather than inventing more.
  const rows: Row[] = [
    { head: 'Get started' },
    { title: 'Claim your name — free', primary: true },
    { head: 'From us' },
    { title: 'The RelayMe blog' },
    { head: 'Music — play here' },
    { title: '2Pac & Dramacydal — Me Against The World', sub: 'Plays here · TIDAL' },
    { title: 'No Sign of Weakness', sub: 'Plays here · Deezer' },
    { title: 'A Bar Song (Tipsy)', sub: 'Plays here · Spotify' },
    { title: 'Sunshine — Jungle', sub: 'Plays here · Apple Music' },
  ]

  return (
    <div className="heromock" aria-hidden="true">
      <div className="handmock">
        {/* The screen goes down first and the photo over the top. Its screen is
            transparent, so the fingers keep overlapping the case. */}
        <div className="handscreen" style={{ background: T.bg }}>
          <div className="handscreeninner">
            <div className="phone-status" style={{ color: T.nameColor }}>
              <span>9:41</span>
              <span className="phone-status-icons">
                <i className="bars" /><i className="wifi" /><i className="batt" />
              </span>
            </div>

            <div className="heromockinner">
              <div className="heromockav" style={{ background: T.nameColor }}>
                <svg viewBox="0 0 160 170" width="34" height="36">
                  <path d="M80 18 L80 6" stroke="#C6F15C" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="80" cy="4" r="7" fill="#C6F15C" />
                  <path d="M80 18 C118 18 136 46 136 84 C136 122 114 146 80 146 C46 146 24 122 24 84 C24 46 42 18 80 18 Z" fill="#B0A0FF" />
                  <circle cx="62" cy="76" r="9" fill="#1B0D44" />
                  <circle cx="98" cy="76" r="9" fill="#1B0D44" />
                  <path d="M64 100 Q80 114 96 100" stroke="#1B0D44" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              <p className="heromockname" style={{ color: T.nameColor }}>RelayMe</p>
              <p className="heromockbio" style={{ color: T.bioColor }}>
                One link that holds everything you make.
              </p>

              <div className="heromocksoc">
                {[0, 1].map((i) => (
                  <span key={i} style={{ background: T.buttonBg }} />
                ))}
              </div>

              <div className="heromocklinks">
                {rows.map((r, i) =>
                  'head' in r ? (
                    <span key={i} className="heromockhead" style={{ color: T.headColor }}>
                      {r.head}
                    </span>
                  ) : (
                    <span key={i} className="heromocklink"
                      style={{
                        background: r.primary ? T.accentBg : T.buttonBg,
                        color: r.primary ? T.accentText : T.buttonText,
                        fontWeight: r.primary ? 700 : 500,
                        boxShadow: r.primary ? 'none' : '0 1px 3px rgba(27,13,68,.10)',
                      }}>
                      {r.title}
                      {r.sub && <i className="heromocksub">{r.sub}</i>}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plain img, not next/image: the file is already sized and encoded, and
            the hero should not wait on an optimiser round trip. */}
        <img className="handimg" src="/hand.webp" alt="" width={960} height={1540} />
      </div>

      <p className="heromockurl">relayme.bio/relayme.bio</p>
    </div>
  )
}
