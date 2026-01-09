import { PricingTable } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { getPostHogClient } from '@/lib/posthog-server'
import { PricingSignUpCta } from './pricing-signup-cta'

export default async function PricingPage() {
  const { userId } = await auth()

  // Track pricing page view server-side (only if PostHog is configured)
  const posthog = getPostHogClient()
  if (posthog) {
    posthog.capture({
      distinctId: userId || 'anonymous',
      event: 'pricing_page_viewed',
      properties: {
        is_authenticated: !!userId,
      }
    })
  }

  return (
    <div className="container mx-auto px-4 flex-1 flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
            Do more with TrackLight Pro
          </h1>
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-muted-foreground">
           with unlimited tracking and notes
          </h2>
        </div>

        {/* Pricing Table */}
        <div className="" data-hide-subscribe={!userId}>
          <PricingTable />
        </div>

        {/* Sign Up CTA for non-logged-in users */}
        {!userId && <PricingSignUpCta />}

        {/* Contact Section */}
        <div className="text-center mt-8 text-lg">
          <span className="text-muted-foreground">Questions? </span>
          <a
            href="mailto:contact@tracklight.app"
            className="text-primary hover:underline font-medium"
          >
            Contact us
          </a>
        </div>
      </div>
    </div>
  )
}

