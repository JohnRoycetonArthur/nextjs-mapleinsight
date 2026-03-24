import { NextRequest, NextResponse } from 'next/server'

/**
 * Forwards the request pathname as a custom header so that the root
 * layout (a React Server Component) can read it and conditionally
 * suppress the global <Header> and <Footer> on consultant-branded routes.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
