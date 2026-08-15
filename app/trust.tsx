'use client'

import { useEffect, useState } from 'react'

/**
 * The trust section.
 *
 * Every other product in this category runs invented testimonials here, and the
 * temptation to match them is strong when the real number of customers is small.
 * Two reasons not to.
 *
 * The legal one: attributing an opinion to a person who does not exist is a
 * misleading commercial practice under the Omnibus Directive and a breach of the
 * FTC's 2024 rule, whether or not the name is presented as fictional.
 *
 * The practical one: /vs-linktree lists four rows where a competitor beats us.
 * That page is the most persuasive thing on this domain, and it only works
 * because nothing else here is decorated. One fabricated quote turns it from a
 * statement into a tactic.
 *
 * So this section carries claims a reader can check rather than opinions they
 * have to take on faith, plus one number that comes out of the database and is
 * true at any size. When there are real customers, `Testimonials` below renders
 * their words and stays invisible until then.
 */

type Counts = { pages: number; links: number; month: number } | null

const PROOF = [
  {
    k: 'Your data sits in the European Union',
    v: 'Database and error logs are hosted in the EU. Not replicated there. Hosted there.',
    tag: 'Privacy',
  },
  {
    k: 'No third-party analytics, no ad pixels',
    v: 'Nobody is watching your visitors but you. Open the network tab on any Relay page and count the domains.',
    tag: 'Privacy',
  },
  {
    k: 'Fonts are served from our own domain',
    v: 'Most link pages load type from a font network, which hands that network the address of everyone who visits you.',
    tag: 'Privacy',
  },
  {
    k: 'The free plan takes no card',
    v: 'No card at sign-up, no trial clock, no reminder email on day twelve. If you never pay us, the page stays up.',
    tag: 'Pricing',
  },
  {
    k: 'Unlimited links on every plan',
    v: 'Including free. The paid plan is about how the page looks and what it can do, never about how much of it you get.',
    tag: 'Pricing',
  },
  {
    k: 'We take nothing from what you sell',
    v: 'No commission, no cut, no transaction fee. We cannot take payments at all, which is the honest reason why.',
    tag: 'Pricing',
  },
  {
    k: 'Stop paying and nothing is deleted',
    v: 'Pro styling switches off. Your links, your page and your address stay exactly where they were.',
    tag: 'If you leave',
  },
  {
    k: 'Your email list is yours',
    v: 'Export the addresses you collect whenever you like, in a format any mailing tool will read.',
    tag: 'If you leave',
  },
]

const CANNOT = [
  'Take payments or tips on the page',
  'Put the page on your own domain',
  'Share an account with a team',
  'Connect to an app store of integrations',
]

export function Trust({ counts }: { counts?: Counts }) {
  const [c, setC] = useState<Counts>(counts || null)

  useEffect(() => {
    if (c) return
    fetch('/api/public-counts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.ok) setC(d.counts) })
      .catch(() => {})
  }, [c])

  const groups = ['Privacy', 'Pricing', 'If you leave']

  return (
    <section className="trust" id="trust">
      <p className="trustkicker">Instead of testimonials</p>
      <h2 className="trusth2">
        Things you can check yourself.
      </h2>
      <p className="trustlede">
        Every link-in-bio site has a wall of five-star quotes. We would rather give you the
        claims that can be verified, including the ones that count against us.
      </p>

      {groups.map((g) => (
        <div key={g} className="trustgroup">
          <p className="trustgrouplab">{g}</p>
          <div className="trustgrid">
            {PROOF.filter((p) => p.tag === g).map((p) => (
              <div key={p.k} className="trustcard">
                <p className="trustk">{p.k}</p>
                <p className="trustv">{p.v}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="trustcannot">
        <p className="trustgrouplab">What Relay cannot do</p>
        <ul>
          {CANNOT.map((x) => <li key={x}>{x}</li>)}
        </ul>
        <p className="trustv" style={{ marginTop: 10 }}>
          If you need any of those, another tool is the right answer and we say so on{' '}
          <a href="/vs-linktree">the comparison page</a>.
        </p>
      </div>

      {c && c.pages > 0 ? (
        <p className="trustcount">
          <strong>{c.pages.toLocaleString('en-GB')}</strong> {c.pages === 1 ? 'page' : 'pages'} published,
          carrying <strong>{c.links.toLocaleString('en-GB')}</strong>{' '}
          {c.links === 1 ? 'link' : 'links'}.
          {c.month > 0 ? ` ${c.month} of them went up this month.` : ''}
          {' '}Counted from the database when you loaded this page, not rounded up.
        </p>
      ) : null}
    </section>
  )
}

/**
 * Real quotes, from real customers, or nothing at all. The table is empty until
 * somebody actually says something, and an empty table renders no markup, which
 * is the correct amount of social proof to show when you have none.
 */
export function Testimonials({ items }: { items?: { quote: string; name: string; role?: string }[] }) {
  if (!items || !items.length) return null
  return (
    <section className="trust">
      <p className="trustkicker">From people using it</p>
      <div className="trustgrid">
        {items.map((t, i) => (
          <figure key={i} className="trustcard">
            <blockquote className="trustquote">{t.quote}</blockquote>
            <figcaption className="trustwho">
              {t.name}{t.role ? <span> · {t.role}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="trustv" style={{ marginTop: 12 }}>
        Every quote here was written by someone with a Relay account and published with their
        permission. We do not pay for them and we do not edit them.
      </p>
    </section>
  )
}
