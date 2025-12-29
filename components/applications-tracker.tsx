"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { MoveUp } from "lucide-react";
import { AddApplicationForm } from "@/components/add-application-form";
import { SortableApplicationsTable } from "@/components/sortable-applications-table";
import { Button } from "@/components/ui/button";
import type { JobApplication } from "@/db/schema";

interface ApplicationsTrackerProps {
  applications: JobApplication[];
  maxRows: number;
  currentCount: number;
  isFreeUser: boolean;
}

export function ApplicationsTracker({ 
  applications, 
  maxRows, 
  currentCount,
  isFreeUser
}: ApplicationsTrackerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter applications based on search query
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) {
      return applications;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return applications.filter((app) => {
      return (
        app.company?.toLowerCase().includes(query) ||
        app.role?.toLowerCase().includes(query) ||
        app.location?.toLowerCase().includes(query) ||
        app.remoteStatus?.toLowerCase().includes(query) ||
        app.salary?.toLowerCase().includes(query) ||
        app.applicationStatus?.toLowerCase().includes(query)
      );
    });
  }, [applications, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="container mx-auto px-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight shrink-0">Job applications tracker</h2>
            <div className="flex-1 max-w-md">
              <AddApplicationForm 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={currentCount >= maxRows ? "text-destructive font-medium" : currentCount >= maxRows * 0.8 ? "text-yellow-600 dark:text-yellow-500 font-medium" : "text-muted-foreground"}>
                {currentCount} / {maxRows} tracked
              </span>
              {isFreeUser && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
              )}
            </div>
            {searchQuery && (
              <span className="text-sm text-muted-foreground">
                Showing {filteredApplications.length} of {applications.length} applications
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="container mx-auto px-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-base">
              <p>No applications tracked yet</p>
              <p className="flex items-center justify-center gap-1">
                <span>Paste the job post link in the field on the top right</span>
                <MoveUp className="size-4" />
              </p>
            </div>
          ) : (
            <SortableApplicationsTable applications={filteredApplications} />
          )}
        </div>
      </div>
    </div>
  );
}

