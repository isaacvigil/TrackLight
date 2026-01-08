"use client"

import { SignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import posthog from 'posthog-js'

export function PricingSignUpCta() {
  function handleCtaClick() {
    posthog.capture('pricing_signup_cta_clicked')
  }

  return (
    <div className="text-center mt-8">
      <SignUpButton mode="modal">
        <Button
          size="lg"
          className="text-lg rounded-full"
          onClick={handleCtaClick}
        >
          Create Account for Free
        </Button>
      </SignUpButton>
    </div>
  )
}
