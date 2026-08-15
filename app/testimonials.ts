/**
 * Real words from real people. Nothing else goes in this file.
 *
 * Every entry must be something an actual person wrote or said about Relay,
 * published with their permission, in their own words. Do not tidy the grammar
 * and do not sharpen the point. A quote that reads like marketing copy is
 * treated as marketing copy by anyone who has read three of them.
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
  // Fill these in with what your testers actually wrote. Keep their phrasing.
  //
  // {
  //   quote: 'the exact words they used, unedited',
  //   name: 'First name, or first name and initial if they prefer',
  //   role: 'what they do — musician, sells prints, runs a supper club',
  //   date: 'August 2026',
  // },
]
