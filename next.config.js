/** @type {import('next').NextConfig} */

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

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
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
