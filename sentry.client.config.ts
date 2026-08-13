// Runs in the visitor's browser. Next 14 loads this file by name; the
// instrumentation-client.ts convention is Next 15 and later.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Off by default, and deliberately left off. With this on, Sentry stores the
  // visitor's IP address and cookies against every event. Relay removed Google
  // Fonts over exactly that kind of disclosure; there is no reason to
  // reintroduce it for error reporting.
  sendDefaultPii: false,

  // Errors are sampled in full. Browser tracing is off, and compiled out of
  // the bundle by the flag in next.config.js — a public page should not carry
  // a performance engine to a phone. Server-side tracing still runs at 10%.
  tracesSampleRate: 0,

  // Session replay records the DOM. On the dashboard that is an email address
  // and billing state; on a public page it is whatever a stranger typed. Left
  // off until the privacy policy says otherwise.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Noise that tells you nothing about your own code.
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'AbortError',
    'Failed to fetch',
    'NetworkError when attempting to fetch resource',
  ],

  beforeSend(event) {
    // A magic-link callback carries an access token in the URL fragment. If one
    // ever throws, the token must not travel with the report.
    try {
      if (event.request && event.request.url) {
        event.request.url = event.request.url.split('#')[0]
      }
    } catch (e) {}
    return event
  },
})
