import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define exact routes we want to handle
const ROUTES = {
  protected: new Set(['/', '/chat']),
  auth: new Set(['/auth/login', '/auth/register']),
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // If the route isn't in our defined routes, let Next.js handle it (e.g., show 404)
  const isKnownRoute = 
    ROUTES.protected.has(pathname) || 
    ROUTES.auth.has(pathname)
  if (!isKnownRoute) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Allow access to auth routes when not logged in
  if (!session && ROUTES.auth.has(pathname)) {
    return res
  }

  // If user is signed in and on auth routes or home, redirect to chat
  if (session && (pathname === '/' || ROUTES.auth.has(pathname))) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  // If user is not signed in and trying to access protected routes, redirect to login
  if (!session && ROUTES.protected.has(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/chat',
    '/auth/login',
    '/auth/register',
  ]
}
