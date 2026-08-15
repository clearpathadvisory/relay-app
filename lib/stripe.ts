// Price IDs come from the environment, so changing a price is a Vercel setting
// rather than a code change and a deploy.
//
// There is deliberately no fallback. An earlier version fell back to the old
// sandbox IDs, which meant a missing or misspelled variable would quietly
// charge the previous price instead of failing. A checkout that throws is
// recoverable; one that silently takes the wrong amount is not.
function priceId(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error('Missing ' + name + '. Set it in Vercel before checkout can run.')
  return v
}
export const PRICE_ANNUAL = () => priceId('STRIPE_PRICE_ANNUAL')
export const PRICE_MONTHLY = () => priceId('STRIPE_PRICE_MONTHLY')

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://relayme.bio'
export const STRIPE_API_VERSION = '2026-07-29.dahlia'
