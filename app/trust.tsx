'use client'

import { TESTIMONIALS, Testimonial } from './testimonials'

/**
 * What people say.
 *
 * Real quotes, from people who used the product, published with permission and
 * unedited. `connection` stays available as an optional field for any quote
 * where the relationship is worth stating, and renders only when it is set.
 */
export function Testimonials({ items }: { items?: Testimonial[] }) {
  const list = items || TESTIMONIALS
  if (!list.length) return null

  return (
    <section className="trust" id="said">
      <p className="trustkicker">Reviews</p>
      <h2 className="trusth2">What people say.</h2>
      <p className="trustlede">
        From people who have used it. Unedited, and published with their permission.
      </p>

      <div className="trustgrid" style={{ marginTop: 26 }}>
        {list.map((t, i) => (
          <figure key={i} className="trustcard">
            <blockquote className="trustquote">{t.quote}</blockquote>
            <figcaption className="trustwho">
              {t.name}
              {t.role ? <span> · {t.role}</span> : null}
              {t.connection ? <em className="trustconn">{t.connection}</em> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
