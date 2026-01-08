"use client"

import { SignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import posthog from 'posthog-js'

export function HomepageSignUpCta() {
  function handleCtaClick() {
    posthog.capture('signup_cta_clicked', {
      location: 'homepage',
    })
  }

  return (
    <SignUpButton mode="modal" forceRedirectUrl="/track">
      <Button
        size="lg"
        className="text-lg rounded-full"
        onClick={handleCtaClick}
      >
        Create Account for Free
      </Button>
    </SignUpButton>
  )
}
