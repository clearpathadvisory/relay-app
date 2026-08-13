// Price IDs come from the environment, so going live — or changing a price
// later — is a Vercel setting rather than a code change and a deploy. The
// sandbox IDs remain as the fallback, which is what runs in development.
export const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL || 'price_1U3h8nQ5Swx4A6oNowdDuRgI'
export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY || 'price_1U3h9wQ5Swx4A6oNUu96eP47'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://relayme.bio'
export const STRIPE_API_VERSION = '2026-07-29.dahlia'
