import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PreviewApplicationsTable } from "@/components/preview-applications-table";
import Image from "next/image";

export default async function Home() {
  // Redirect authenticated users to the track page
  const { userId } = await auth();
  
  if (userId) {
    redirect("/track");
  }
  return (
    <div 
      className="flex flex-1 items-start justify-center pt-[15vh] p-8"
    >
      <main className="w-full max-w-4xl space-y-16">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight text-foreground">
              Effortless job application tracking
            </h1>
            <h2 className="text-2xl text-muted-foreground">
            TrackLight extracts the details from job post links, so you can focus on applying
            </h2>
          </div>
          <SignUpButton mode="modal" forceRedirectUrl="/track">
            <Button size="lg" className="text-lg rounded-full">
              Create Account for Free
            </Button>
          </SignUpButton>
        </div>

        <div className="flex justify-center">
          <Image
            src="/girl-laptop.jpg"
            alt="Person working on laptop"
            width={400}
            height={268}
            className="rounded-[40px] shadow-lg"
            priority
          />
        </div>

        {/* <PreviewApplicationsTable /> */}
      </main>
    </div>
  );
}
