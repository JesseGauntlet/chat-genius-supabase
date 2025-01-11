import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define exact routes we want to handle
const ROUTES = {
  protected: new Set(['/', '/chat', '/workspaces']),
  auth: new Set(['/auth/login', '/auth/register']),
}

export async function middleware(req: NextRequest) {
  // If for some reason req.url is empty, bail out:
  if (!req.url) {
    return NextResponse.next()
  }

  const { pathname, searchParams } = req.nextUrl
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  // If the route isn't in our defined routes, let Next.js handle it (e.g., show 404)
  const isKnownRoute = 
    ROUTES.protected.has(pathname) || 
    ROUTES.auth.has(pathname)
  if (!isKnownRoute) {
    return NextResponse.next()
  }

  // For any route that needs a workspace param in /chat
  if (session && pathname === '/chat' && !searchParams.get('workspace')) {
    const url = req.nextUrl.clone()
    url.pathname = '/workspaces'
    return NextResponse.redirect(url)
  }

  // If user has a workspace, redirect to chat
  // Example usage:
  if (session && (pathname === '/' || pathname === '/auth/login')) {
    const { data: memberWorkspaces } = await supabase
      .from('members')
      .select('workspace_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single()

    if (memberWorkspaces?.workspace_id) {
      const url = req.nextUrl.clone()
      url.pathname = '/chat'
      url.searchParams.set('workspace', memberWorkspaces.workspace_id.toString())
      return NextResponse.redirect(url)
    } else {
      const url = req.nextUrl.clone()
      url.pathname = '/workspaces'
      return NextResponse.redirect(url)
    }
  }

  // If user is not signed in and trying to access protected routes
  if (!session && pathname.startsWith('/chat')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return res
}
