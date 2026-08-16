'use client'

import { TESTIMONIALS, Testimonial } from './testimonials'
import { Heart, LinkDoodle } from './blob'

/**
 * What people say.
 *
 * Five testers used RelayMe before launch and wrote in with what they thought.
 * Their words, published with permission. Only the product name has been
 * updated since they wrote them — nothing else is altered, and the page no
 * longer claims the quotes are unedited, because that would no longer be true.
 * Renders nothing while the
 * array is empty, which is the correct amount of social proof to show when you
 * have none.
 *
 * Deliberately absent: a star rating, an average, and a count of creators.
 * Three named people saying something specific outperforms a wall of stars with
 * this audience, who are sold to constantly and can tell.
 */
export function Testimonials({ items }: { items?: Testimonial[] }) {
  const list = items || TESTIMONIALS
  if (!list.length) return null

  return (
    <section className="trust revband" id="said">
      <span className="heroart">
        <Heart size={26} style={{ position: 'absolute', top: 34, right: 40 }} />
        <LinkDoodle size={40} style={{ position: 'absolute', bottom: 22, left: 32 }} />
      </span>
      <p className="trustkicker">Reviews</p>
      <h2 className="trusth2">What people say.</h2>
      <p className="trustlede">
        From people who have used it, published with their permission.
      </p>

      <div className="revgrid">
        {list.map((t, i) => (
          <figure key={i} className={'revcard rev' + (i % 5)}>
            <span className="revmark" aria-hidden="true">&ldquo;</span>
            <blockquote className="revquote">{t.quote}</blockquote>
            <figcaption className="revwho">
              <span className="revdot" aria-hidden="true">{t.name.charAt(0)}</span>
              <span>
                <strong>{t.name}</strong>
                {t.role ? <em>{t.role}</em> : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
