import * as Sentry from '@sentry/nextjs'

// Node runtime: the API routes, the Stripe webhook, server-rendered pages.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,

  beforeSend(event) {
    // Never let a service-role key, a Stripe secret or a session token reach a
    // third party because it happened to be in scope when something threw.
    const secrets = [
      'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
      'RESEND_API_KEY', 'SENTRY_AUTH_TOKEN', 'TRACK_SALT',
    ]
    try {
      if (event.request && event.request.headers) {
        delete (event.request.headers as any).authorization
        delete (event.request.headers as any).cookie
        delete (event.request.headers as any)['stripe-signature']
      }
      let json = JSON.stringify(event)
      for (const name of secrets) {
        const value = process.env[name]
        if (value && value.length > 8) json = json.split(value).join('[redacted ' + name + ']')
      }
      return JSON.parse(json)
    } catch (e) {
      return event
    }
  },
})
