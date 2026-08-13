// The strongest thing Relay has is what a finished page looks like, and the
// homepage was showing a mascot instead. This is a real page in Sherbet — the
// theme a free account lands on — drawn as markup rather than a screenshot, so
// it stays sharp at any size and costs no image request.
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
      <div className="phone">
        <span className="phone-btn phone-btn-a" />
        <span className="phone-btn phone-btn-b" />
        <span className="phone-btn phone-btn-c" />
        <span className="phone-btn phone-btn-power" />

        <div className="phone-screen" style={{ background: T.bg }}>
          <div className="phone-island" />

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

            <span className="heromockbadge">Join adawren on Relay</span>
          </div>
        </div>
      </div>
      <p className="heromockurl">relayme.bio/adawren</p>
    </div>
  )
}
