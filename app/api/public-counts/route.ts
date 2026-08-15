import { NextResponse } from 'next/server'
import { serverClient } from '../../../lib/supabase'

export const runtime = 'nodejs'
export const revalidate = 300

// Three counts, nothing identifying. The homepage states a real number instead
// of a rounded-up one, so this is the only claim on that section that changes,
// and it has to be true every time it is read.
export async function GET() {
  try {
    const sb = serverClient(true)
    const since = new Date()
    since.setDate(1)
    since.setHours(0, 0, 0, 0)

    const [pages, links, month] = await Promise.all([
      sb.from('pages').select('id', { count: 'exact', head: true }).eq('is_published', true),
      sb.from('links').select('id', { count: 'exact', head: true }),
      sb.from('pages').select('id', { count: 'exact', head: true })
        .eq('is_published', true).gte('created_at', since.toISOString()),
    ])

    return NextResponse.json({
      ok: true,
      counts: { pages: pages.count || 0, links: links.count || 0, month: month.count || 0 },
    })
  } catch (e) {
    // A homepage section is not worth a 500. It simply does not draw the line.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
