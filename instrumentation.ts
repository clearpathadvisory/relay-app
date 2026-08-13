import * as Sentry from '@sentry/nextjs'

// Next calls this once per runtime as the server starts, which is how the
// server and edge configs get loaded without importing them from app code.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Errors thrown while rendering a server component never reach an error
// boundary in a way the SDK sees. This is the hook that catches them.
export const onRequestError = Sentry.captureRequestError
