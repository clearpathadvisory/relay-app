// Address ranges that must never be reachable from a URL a user pasted.
// The old check matched on the hostname string, which missed 172.16/12, the
// carrier-grade range, bare IPv6 and anything reached through a redirect.
export function isPrivateAddress(ip: string): boolean {
  const v = ip.trim().toLowerCase()

  if (v.indexOf(':') >= 0) {
    // IPv6: loopback, unspecified, unique-local, link-local, and any
    // IPv4-mapped address unwrapped and re-checked
    if (v === '::1' || v === '::') return true
    if (/^f[cd]/.test(v)) return true            // fc00::/7 unique local
    if (/^fe[89ab]/.test(v)) return true         // fe80::/10 link local
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }

  const p = v.split('.').map((n) => parseInt(n, 10))
  if (p.length !== 4 || p.some((n) => isNaN(n) || n < 0 || n > 255)) return true

  const [a, b] = p
  if (a === 0) return true                            // 0.0.0.0/8
  if (a === 10) return true                           // private
  if (a === 127) return true                          // loopback
  if (a === 169 && b === 254) return true             // link local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true    // private
  if (a === 192 && b === 168) return true             // private
  if (a === 192 && b === 0) return true               // 192.0.0/24 and test nets
  if (a === 100 && b >= 64 && b <= 127) return true   // carrier grade NAT
  if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
  if (a >= 224) return true                           // multicast and reserved
  return false
}
