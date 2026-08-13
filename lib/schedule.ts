// The window on a link, described in words rather than timestamps. Kept out of
// the component so it can be tested, since off-by-one date logic is exactly the
// kind of thing that looks right and is not.
export type Window = { starts_at: string | null; ends_at: string | null }

export function scheduleState(w: Window, now: Date = new Date()): 'none' | 'waiting' | 'live' | 'ended' {
  const start = w.starts_at ? new Date(w.starts_at) : null
  const end = w.ends_at ? new Date(w.ends_at) : null
  if (!start && !end) return 'none'
  if (end && end.getTime() <= now.getTime()) return 'ended'
  if (start && start.getTime() > now.getTime()) return 'waiting'
  return 'live'
}

function when(d: Date, now: Date) {
  const sameYear = d.getFullYear() === now.getFullYear()
  const date = d.toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric',
  })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return date + ' at ' + time
}

export function scheduleLabel(w: Window, now: Date = new Date()): string {
  const state = scheduleState(w, now)
  if (state === 'none') return ''
  if (state === 'ended') return 'Ended ' + when(new Date(w.ends_at as string), now)
  if (state === 'waiting') return 'Live from ' + when(new Date(w.starts_at as string), now)
  if (w.ends_at) return 'Live until ' + when(new Date(w.ends_at as string), now)
  return 'Live'
}
