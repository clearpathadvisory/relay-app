// A small per-instance limiter for the routes that cost money or send email.
// Vercel runs several instances, so this is a ceiling rather than a guarantee —
// but it turns "unbounded" into "bounded per instance", which is the difference
// between a runaway bill and a rounding error. Anything needing a hard limit
// belongs in the database, as the click counter does.
const BUCKETS: Map<string, number[]> = (globalThis as any).__relayRate || new Map()
;(globalThis as any).__relayRate = BUCKETS

export function tooMany(bucket: string, key: string, limit: number, windowMs: number): boolean {
  const id = bucket + ':' + key
  const now = Date.now()
  const hits = (BUCKETS.get(id) || []).filter((t) => now - t < windowMs)
  hits.push(now)
  BUCKETS.set(id, hits)
  if (BUCKETS.size > 10000) BUCKETS.clear()
  return hits.length > limit
}
