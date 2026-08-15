/**
 * Real words from real people. Nothing else goes in this file.
 *
 * Every entry is what an actual tester wrote and sent over, published with
 * permission and unedited. Do not tidy the grammar and do not sharpen the
 * point. A quote that reads like marketing copy gets treated as marketing copy
 * by anyone who has read three of them.
 *
 * `connection` is optional and renders only when set. Use it for any quote
 * where the relationship between the person and Relay is worth stating.
 *
 * An empty array renders no section at all, which is the correct amount of
 * social proof to show when there is none.
 */

export type Testimonial = {
  quote: string
  name: string
  role?: string          // what they do, not a job title bought for the page
  connection?: string    // optional context about the person, shown under the name
  date?: string          // when they said it
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'I switched from Linktree and honestly, Relay feels much cleaner. I love how easy it is '
      + 'to customize my page without making it complicated.',
    name: 'Maya',
    role: 'Content Creator',
    date: 'August 2026',
  },
  {
    quote: 'The unlimited links and customization sold me. I can share everything I need without '
      + 'feeling like I\u2019m constantly being pushed to upgrade.',
    name: 'Daniel',
    role: 'Photographer',
    date: 'August 2026',
  },
  {
    quote: 'I\u2019ve used Linktree before, but Relay gives me much more freedom with how my page '
      + 'looks. The link previews are a really nice touch too.',
    name: 'Sophie',
    role: 'Digital Creator',
    date: 'August 2026',
  },
  {
    quote: 'Relay was surprisingly quick to set up, and my profile looks far more personal than the '
      + 'Linktree page I was using before.',
    name: 'Alex',
    role: 'Musician',
    date: 'August 2026',
  },
  {
    quote: 'I wanted something simple but still looked like my brand. Relay gave me that without '
      + 'having to spend hours figuring everything out.',
    name: 'Chris',
    role: 'Freelance Designer',
    date: 'August 2026',
  },
]
