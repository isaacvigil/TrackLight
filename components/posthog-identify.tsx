"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import posthog from "posthog-js"

/**
 * Component that handles PostHog user identification when Clerk user state changes.
 * Should be placed inside ThemedClerkProvider to have access to Clerk context.
 */
export function PostHogIdentify() {
  const { user, isSignedIn, isLoaded } = useUser()
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && user) {
      // Only identify if we haven't identified this user yet in this session
      if (identifiedRef.current !== user.id) {
        posthog.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          username: user.username,
          created_at: user.createdAt?.toISOString(),
        })
        identifiedRef.current = user.id
      }
    } else if (!isSignedIn && identifiedRef.current) {
      // User signed out, reset PostHog
      posthog.reset()
      identifiedRef.current = null
    }
  }, [isSignedIn, user, isLoaded])

  return null
}
