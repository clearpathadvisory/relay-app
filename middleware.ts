import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The dashboard is client-rendered, so a signed-out visitor used to watch an
// empty shell for up to two and a half seconds before being told. Supabase
// keeps its session in localStorage, which middleware cannot read, so this
// cannot check the session itself — what it can do is stop the request being
// cached anywhere and keep the private routes out of any shared cache.
//
// The data is safe regardless: row-level security is the boundary, not this.
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/auth/:path*', '/monitoring'],
}
