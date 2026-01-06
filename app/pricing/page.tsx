import { PricingTable, SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { Button } from '@/components/ui/button'

export default async function PricingPage() {
  const { userId } = await auth()

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
        {!userId && (
          <div className="text-center mt-8">
            <SignUpButton mode="modal">
              <Button size="lg" className="text-lg rounded-full">
                Create Account for Free
              </Button>
            </SignUpButton>
          </div>
        )}

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

