import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { jobApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function TrackPage() {
  // ✅ CORRECT: Authenticate user first
  const { userId } = await auth();
  
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

  return (
    <div 
      className="min-h-screen bg-background p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/bg.jpg)' }}
    >
      <main className="container mx-auto max-w-7xl space-y-8">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Job Applications</CardTitle>
            <CardDescription>
              Track all your job opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Date Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No applications yet. Start tracking your job opportunities!
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.company}</TableCell>
                      <TableCell>{app.role}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                          {app.applicationStatus}
                        </span>
                      </TableCell>
                      <TableCell>{app.location || "—"}</TableCell>
                      <TableCell>{app.salary || "—"}</TableCell>
                      <TableCell>
                        {app.appliedDate 
                          ? new Date(app.appliedDate).toLocaleDateString()
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

