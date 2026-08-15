'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toCsv, downloadCsv, stamp } from '../lib/csv'

/**
 * Where your visitors are.
 *
 * Reads the country codes already recorded against page views and taps and
 * shows them as a ranked list. Pro only, gated server-side as well as here —
 * this component hiding the panel is a courtesy, not the control.
 *
 * Nothing here identifies anyone. The API returns counts per two-letter
 * country code and nothing else; the visitor's address was hashed when the
 * event was written and thrown away hours later.
 */

// A regional indicator pair renders as a flag on every platform we care about,
// so there is no image to load and nothing to keep updated when a flag design
// changes. Falls back to the letters themselves where the font has no glyph.
function flag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return ''
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

const NAMES: Record<string, string> = {
  PL: 'Poland', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  FR: 'France', ES: 'Spain', IT: 'Italy', NL: 'Netherlands', IE: 'Ireland',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PT: 'Portugal',
  CZ: 'Czechia', SK: 'Slovakia', UA: 'Ukraine', RO: 'Romania', HU: 'Hungary',
  AT: 'Austria', BE: 'Belgium', CH: 'Switzerland', GR: 'Greece', TR: 'Turkey',
  CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', AU: 'Australia',
  NZ: 'New Zealand', JP: 'Japan', KR: 'South Korea', CN: 'China', IN: 'India',
  ID: 'Indonesia', PH: 'Philippines', SG: 'Singapore', TH: 'Thailand',
  VN: 'Vietnam', MY: 'Malaysia', AE: 'United Arab Emirates', SA: 'Saudi Arabia',
  IL: 'Israel', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', EG: 'Egypt',
  GH: 'Ghana', MA: 'Morocco', RU: 'Russia',
}

type Row = { country: string; count: number; views: number; clicks: number }

export function Countries({ pageId, isPro }: { pageId: string; isPro: boolean }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [total, setTotal] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!isPro || !pageId) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: s } = await supabase.auth.getSession()
        const token = s.session?.access_token
        if (!token) return
        const r = await fetch('/api/countries?pageId=' + encodeURIComponent(pageId) + '&days=30', {
          headers: { authorization: 'Bearer ' + token },
        })
        if (!r.ok) { if (!cancelled) setFailed(true); return }
        const j = await r.json()
        if (cancelled) return
        setRows(j.countries || [])
        setTotal(j.total || 0)
      } catch (e) {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => { cancelled = true }
  }, [pageId, isPro])

  function exportCsv() {
    if (!rows || rows.length === 0) return
    downloadCsv(
      'relay-countries-' + stamp() + '.csv',
      toCsv(
        ['country_code', 'country', 'visits', 'opened', 'tapped', 'share_percent'],
        rows.map((r) => [
          r.country,
          NAMES[r.country] || r.country,
          r.count,
          r.views,
          r.clicks,
          total > 0 ? Math.round((r.count / total) * 100) : 0,
        ])
      )
    )
  }

  if (!isPro) {
    return (
      <div className="block block-sun">
        <h2 className="bh">Where your visitors are</h2>
        <p className="bsub" style={{ marginBottom: 0 }}>
          Pro shows you the countries your visitors open your page from, over the last thirty days.
          Useful when you are deciding what time to post, or telling a brand who your audience is.
        </p>
      </div>
    )
  }

  return (
    <div className="block block-sun">
      <h2 className="bh">Where your visitors are</h2>
      <p className="bsub">Countries your page was opened or tapped from, last thirty days.</p>

      {failed && <p className="bsub" style={{ marginBottom: 0 }}>Could not load this just now. Try again in a moment.</p>}

      {!failed && rows === null && <p className="bsub" style={{ marginBottom: 0 }}>Counting…</p>}

      {!failed && rows !== null && rows.length === 0 && (
        <p className="bsub" style={{ marginBottom: 0 }}>
          No visits with a country yet. This fills in on its own once people start opening your page.
        </p>
      )}

      {!failed && rows !== null && rows.length > 0 && (
        <>
          {rows.map((r) => {
            const pct = total > 0 ? Math.round((r.count / total) * 100) : 0
            return (
              <div key={r.country} className="statrow">
                <span className="statrowname">
                  <span className="cflag" aria-hidden="true">{flag(r.country)}</span>
                  {NAMES[r.country] || r.country}
                  {/* The API already separates opens from taps per country, and
                      that split is the interesting part for anyone pitching a
                      brand: it is the difference between being seen somewhere
                      and being acted on somewhere. */}
                  <span className="csplit">{r.views} opened · {r.clicks} tapped</span>
                </span>
                <span className="statrowbar">
                  <span style={{ width: Math.round((r.count / Math.max(1, rows[0].count)) * 100) + '%' }} />
                </span>
                <span className="statrownum">{pct}%</span>
              </div>
            )
          })}
          <p className="bsub" style={{ margin: '16px 0 0' }}>
            {total} {total === 1 ? 'visit' : 'visits'} with a known country across{' '}
            {rows.length} {rows.length === 1 ? 'place' : 'places'}.
          </p>
          <button className="btn small ghost" style={{ marginTop: 14 }} onClick={exportCsv}>
            Download as CSV
          </button>
          <p className="bsub" style={{ margin: '8px 0 0', fontSize: 13 }}>
            Opens in a spreadsheet. Useful when a brand asks where your audience is.
          </p>
        </>
      )}
    </div>
  )
}
