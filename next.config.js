/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

// Sent on every response. None of these change how the site behaves; they
// close off the cheap attacks that need no bug on our side to work.
const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

// The signed-in surfaces must never be framed: an invisible iframe over a
// decoy page is how clickjacking gets someone to delete their own account.
// Public profile pages stay embeddable on purpose — people put them in sites.
const privateHeaders = baseHeaders.concat([
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
])

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // The Sentry browser bundle carries its tracing engine whether or not it is
  // used. A public profile page is the one thing on this site that has to be
  // fast on a phone, so the flag below lets webpack drop that code from the
  // client build entirely. Server and edge tracing are unaffected.
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({ __SENTRY_TRACING__: false, __RRWEB_EXCLUDE_SHADOW_DOM__: true })
      )
    }
    return config
  },
  async headers() {
    return [
      { source: '/dashboard/:path*', headers: privateHeaders },
      { source: '/dashboard', headers: privateHeaders },
      { source: '/login', headers: privateHeaders },
      { source: '/auth/:path*', headers: privateHeaders },
      { source: '/:path*', headers: baseHeaders },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Read from the environment variables the Vercel integration already set.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Without uploaded source maps every stack trace points at minified bundle
  // gibberish. The auth token comes from the Vercel integration.
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Reports go out through relayme.bio rather than a third-party domain, so ad
  // blockers stop eating them — and no visitor's browser talks to Sentry direct.
  tunnelRoute: '/monitoring',

  silent: !process.env.CI,
  telemetry: false,

  webpack: {
    // Strips the SDK's own console noise out of the production bundle.
    treeshake: { removeDebugLogging: true },
    // Uptime checks against a route we do not have; off.
    automaticVercelMonitors: false,
  },
})
