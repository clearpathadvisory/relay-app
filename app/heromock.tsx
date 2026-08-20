// The strongest thing RelayMe has is what a finished page looks like, and the
// homepage was showing a mascot instead. This is a real page in Sherbet — the
// theme a free account lands on.
//
// The device is a photograph of a hand holding a phone; the SCREEN is still
// markup, drawn live inside it. That split is the whole point:
//
//   - the screen stays sharp at any density and any zoom, costs no image
//     request, and follows the theme colours if they are ever changed here
//   - the hand brings the realism a drawn phone cannot, because skin, shadow
//     and the way fingers wrap a case are not things CSS does convincingly
//
// The photo is keyed so its screen area is transparent, which is why the page
// underneath shows through rather than being pasted on top: the fingers still
// overlap the case exactly as they do in the original.
//
// The source is 480x770 and is served at 2x, so it is doing more work than it
// was scanned for. Skin and shadow carry that better than text would — which is
// the other reason the screen is not part of the image. If a larger original
// ever turns up, replace public/hand.webp and change nothing else.

// The screen's position inside the photo (42.083% / 20.779%, 45% x 61.039%)
// and its 216px design width both live in globals.css, on .handscreen and
// .handscreeninner. They were measured from the keyed file, not guessed.

export function HeroMock() {
  const T = {
    bg: '#F4F1FF',
    buttonBg: '#FFFFFF',
    buttonText: '#26215C',
    accentBg: '#97C459',
    accentText: '#173404',
    nameColor: '#26215C',
    bioColor: '#534AB7',
  }

  const links = [
    { title: 'New single — out now', primary: true },
    { title: 'Tour dates, autumn 2026', primary: false },
    { title: 'The newsletter', primary: false },
    { title: 'Prints and merch', primary: false },
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
              <div className="heromockav" style={{ background: T.accentBg }}>
                <svg viewBox="0 0 160 170" width="34" height="36">
                  <path d="M80 18 L80 6" stroke="#173404" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="80" cy="4" r="7" fill="#F4F1FF" />
                  <path d="M80 18 C118 18 136 46 136 84 C136 122 114 146 80 146 C46 146 24 122 24 84 C24 46 42 18 80 18 Z" fill="#F4F1FF" />
                  <circle cx="62" cy="76" r="9" fill="#173404" />
                  <circle cx="98" cy="76" r="9" fill="#173404" />
                  <path d="M64 100 Q80 114 96 100" stroke="#173404" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              <p className="heromockname" style={{ color: T.nameColor }}>Ada Wren</p>
              <p className="heromockbio" style={{ color: T.bioColor }}>
                Songs, mostly. Somewhere between a lullaby and a warning.
              </p>

              <div className="heromocksoc">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} style={{ background: T.bioColor }} />
                ))}
              </div>

              <div className="heromocklinks">
                {links.map((l) => (
                  <span key={l.title} className="heromocklink"
                    style={{
                      background: l.primary ? T.accentBg : T.buttonBg,
                      color: l.primary ? T.accentText : T.buttonText,
                      fontWeight: l.primary ? 700 : 500,
                      boxShadow: l.primary ? 'none' : '0 1px 3px rgba(38,33,92,.10)',
                    }}>
                    {l.title}
                  </span>
                ))}
              </div>

              <span className="heromockbadge">Join adawren on RelayMe</span>
            </div>
          </div>
        </div>

        {/* Plain img, not next/image: the file is already sized and encoded, and
            the hero should not wait on an optimiser round trip. */}
        <img className="handimg" src="/hand.webp" alt="" width={960} height={1540} />
      </div>

      <p className="heromockurl">relayme.bio/adawren</p>
    </div>
  )
}
