import { PricingTable } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

export default async function PricingPage() {
  await auth() // Ensure user is authenticated

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-medium tracking-tight text-foreground">
            Upgrade to TrackLight Pro
          </h1>
        </div>

        {/* Pricing Table */}
        <div className="mb-12">
          <PricingTable />
        </div>

        {/* Contact Section */}
        <div className="text-center mt-16 text-lg">
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

