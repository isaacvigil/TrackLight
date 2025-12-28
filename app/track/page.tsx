import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { jobApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AddApplicationForm } from "@/components/add-application-form";
import { SortableApplicationsTable } from "@/components/sortable-applications-table";

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
  const maxRows = has1kRows ? 1000 : 25;
  const currentCount = applications.length;

  return (
    <div className="min-h-screen bg-background p-8">
      <main className="container mx-auto max-w-7xl space-y-8">
        <AddApplicationForm />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Job applications tracker</h2>
            </div>
            <span className={currentCount >= maxRows ? "text-destructive font-medium" : currentCount >= maxRows * 0.8 ? "text-yellow-600 dark:text-yellow-500 font-medium" : "text-muted-foreground"}>
              {currentCount} / {maxRows} applications
            </span>
          </div>

          <SortableApplicationsTable applications={applications} />
        </div>
      </main>
    </div>
  );
}

