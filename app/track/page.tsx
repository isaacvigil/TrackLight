import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { jobApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ApplicationsTracker } from "@/components/applications-tracker";

export default async function TrackPage() {
  // ✅ CORRECT: Authenticate user first
  const { userId, has } = await auth();
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect("/");
  }

  // ✅ CORRECT: Fetch data from database filtered by userId
  const applications = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.createdAt));

  // Debug: Log application IDs and their statusChangeDate to verify correct data
  if (process.env.NODE_ENV === 'development') {
    console.log('Applications data:', applications.map(app => ({
      id: app.id,
      company: app.company,
      statusChangeDate: app.statusChangeDate,
    })));
  }

  // Check plan limits
  const has1kRows = has({ feature: '1k_rows' });
  const maxRows = has1kRows ? 1000 : 20;
  const currentCount = applications.length;
  
  // Check if user is on free plan
  const isFreeUser = has({ plan: 'free_user' });

  return (
    <div className="min-h-screen py-8">
      <ApplicationsTracker 
        applications={applications}
        maxRows={maxRows}
        currentCount={currentCount}
        isFreeUser={isFreeUser}
      />
    </div>
  );
}

