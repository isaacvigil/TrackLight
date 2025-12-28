import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles, Zap, Shield } from "lucide-react";

export default async function Home() {
  // Redirect authenticated users to the track page
  const { userId } = await auth();
  
  if (userId) {
    redirect("/track");
  }
  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-background p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/bg.jpg)' }}
    >
      <main className="w-full max-w-4xl space-y-8">
        <div className="space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Effortless job application tracking
          </h1>
          <SignUpButton mode="modal" forceRedirectUrl="/track">
            <Button size="lg" className="text-lg rounded-full">
              Create account for free
            </Button>
          </SignUpButton>
        </div>

        <div className="hidden grid gap-6 md:grid-cols-3">
          <Card variant="glass">
            <CardHeader>
              <Sparkles className="size-8 text-primary mb-4" />
              <CardTitle>Paste the job link into the field</CardTitle>
              <Input 
                placeholder="https://job-boards.eu.greenhouse.io/company" 
                disabled 
                className="mt-2 text-lg text-white placeholder:text-lg placeholder:text-white truncate"
              />
            </CardHeader>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <Zap className="size-8 text-primary mb-4" />
              <CardTitle>TrackLight fills in the job details</CardTitle>
              <CardDescription>
                Copy-paste components that you can modify
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <Shield className="size-8 text-primary mb-4" />
              <CardTitle>Keep status track and add notes</CardTitle>
              <CardDescription>
                Full TypeScript support with excellent DX
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
