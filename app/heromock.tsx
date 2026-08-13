import { Blob } from './blob'

// The strongest thing Relay has is what a finished page looks like, and the
// homepage was showing a mascot instead. This is a real page rendered in the
// Dusk theme — one of the five a free account gets — not a screenshot, so it
// stays sharp on any screen and costs no image request.
export function HeroMock() {
  const T = {
    bg: '#1B0D44',
    buttonBg: '#2C1C5E',
    buttonText: '#EDE8FF',
    accentBg: '#C6F15C',
    accentText: '#1B0D44',
    nameColor: '#EDE8FF',
    bioColor: '#B0A0FF',
  }

  const links = [
    { title: 'New single — out now', primary: true },
    { title: 'Tour dates, autumn 2026', primary: false },
    { title: 'The newsletter', primary: false },
    { title: 'Prints and merch', primary: false },
  ]

  return (
    <div className="heromock" aria-hidden="true">
      <div className="heromockframe" style={{ background: T.bg }}>
        <div className="heromockinner">
          <div className="heromockav">
            <Blob size={54} animated={false} />
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
                }}>
                {l.title}
              </span>
            ))}
          </div>

          <span className="heromockbadge">Join adawren on Relay</span>
        </div>
      </div>
      <p className="heromockurl">relayme.bio/adawren</p>
    </div>
  )
}
