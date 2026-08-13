import * as Sentry from '@sentry/nextjs'

// Edge runtime: the two OG image routes and the apple icon.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
})
