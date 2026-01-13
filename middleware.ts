import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define routes that should redirect unauthenticated users to home
const isTrackRoute = createRouteMatcher(['/track'])

export default clerkMiddleware(async (auth, req) => {
  // Check if user is accessing /track
  if (isTrackRoute(req)) {
    const { userId } = await auth()
    
    // If not authenticated, redirect to home page
    if (!userId) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  
  // For all other routes, continue normally
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
