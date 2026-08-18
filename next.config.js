/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

// Content-Security-Policy. This is the browser-side counterpart to the
// server-side checks: even if markup injection ever slipped past escaping,
// the browser refuses to run foreign scripts, send data to foreign hosts,
// or frame anything outside the embed providers listed below.
//
// The audit that produced this walked every external reference in the app:
//  - scripts: none external. Next.js needs its own inline bootstrap scripts,
//    hence 'unsafe-inline'. A nonce scheme would break the statically cached
//    public pages, so this is the deliberate trade at this stage.
//  - styles: bundled CSS plus React style attributes → 'unsafe-inline'.
//  - images: link thumbnails hotlink favicons/og:images from the linked
//    sites, so img-src must allow any https origin. Images cannot execute.
//    blob: is the local preview before an avatar/thumb upload finishes.
//  - connect: the Supabase project (auth, database, storage uploads).
//    Sentry is tunnelled through /monitoring, which is 'self'.
//  - frames: the click-to-load embeds, nothing else. One host per
//    service, and a second for Mixcloud because its widget redirects.
//  - fonts are self-hosted (fontsource), so font-src stays 'self'.
// Dev only: Next's dev tooling evaluates code at runtime, so 'unsafe-eval'
// is appended when not in production. It is never sent from Vercel.
const isDev = process.env.NODE_ENV !== 'production'
const SUPABASE_ORIGIN = 'https://fhwxxobzeqiypgeazdub.supabase.co'
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_ORIGIN}`,
  "media-src 'self' blob:",
  [
    'frame-src',
    'https://www.youtube-nocookie.com',
    'https://open.spotify.com',
    'https://w.soundcloud.com',
    'https://embed.music.apple.com',
    'https://bandcamp.com',
    'https://embed.tidal.com',
    'https://widget.deezer.com',
    // Mixcloud serves the widget from www and has begun redirecting it to a
    // dedicated host. A redirect is a fresh frame navigation, so the
    // destination needs listing too or the player goes blank on the hop.
    'https://www.mixcloud.com',
    'https://player-widget.mixcloud.com',
    'https://audiomack.com',
    // Booking. Both frame without complaint today; if either ever starts
    // sending frame-ancestors the card goes blank with no error, so that is the
    // first thing to check if bookings stop rendering.
    'https://cal.com',
    'https://app.cal.com',
    'https://calendly.com',
  ].join(' '),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

// Sent on every response. None of these change how the site behaves; they
// close off the cheap attacks that need no bug on our side to work.
// Note: no frame-ancestors here — public profile pages stay embeddable
// on purpose, people put them in their own sites.
const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
]

// The signed-in surfaces must never be framed: an invisible iframe over a
// decoy page is how clickjacking gets someone to delete their own account.
// They also get Cross-Origin-Opener-Policy so a tab they open (or that
// opened them) cannot keep a scripting handle on the signed-in window.
const privateHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Content-Security-Policy', value: csp + "; frame-ancestors 'none'" },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // The share card and the story image read the Manrope files from disk with a
  // path built at runtime, which Vercel's tracing cannot follow — so without
  // this the fonts are simply not in the deployed bundle.
  outputFileTracingIncludes: {
    '/**': ['./assets/fonts/**'],
  },

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
    // Order matters: when two rules match the same path and set the same
    // header key, Next keeps the LAST one. The catch-all therefore goes
    // first, and the private routes after it, so their stricter
    // Content-Security-Policy (with frame-ancestors 'none') wins.
    return [
      { source: '/:path*', headers: baseHeaders },
      { source: '/dashboard/:path*', headers: privateHeaders },
      { source: '/dashboard', headers: privateHeaders },
      { source: '/login', headers: privateHeaders },
      { source: '/auth/:path*', headers: privateHeaders },
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
