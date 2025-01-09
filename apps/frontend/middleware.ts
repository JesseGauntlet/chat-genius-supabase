import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define exact routes we want to handle
const ROUTES = {
  protected: new Set(['/', '/chat', '/workspaces']),
  auth: new Set(['/auth/login', '/auth/register']),
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const searchParams = req.nextUrl.searchParams

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
    // Get user's workspaces
    const { data: memberWorkspaces } = await supabase
      .from('members')
      .select('workspace_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    // If user has a workspace, redirect to chat with that workspace
    if (memberWorkspaces?.workspace_id) {
      return NextResponse.redirect(new URL(`/chat?workspace=${memberWorkspaces.workspace_id}`, req.url))
    }
    
    // If no workspace, redirect to workspaces page
    return NextResponse.redirect(new URL('/workspaces', req.url))
  }

  // If accessing chat without workspace param, redirect to workspaces
  if (session && pathname === '/chat' && !searchParams.get('workspace')) {
    return NextResponse.redirect(new URL('/workspaces', req.url))
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
    '/workspaces',
    '/auth/login',
    '/auth/register',
  ]
}
