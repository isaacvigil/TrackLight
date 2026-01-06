"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { MoveUp } from "lucide-react";
import { AddApplicationForm } from "@/components/add-application-form";
import { SortableApplicationsTable } from "@/components/sortable-applications-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobApplication } from "@/db/schema";

interface ApplicationsTrackerProps {
  applications: JobApplication[];
  maxRows: number;
  currentCount: number;
  isFreeUser: boolean;
  hasUnlimitedRows: boolean;
}

export function ApplicationsTracker({ 
  applications, 
  maxRows, 
  currentCount,
  isFreeUser,
  hasUnlimitedRows
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
    <div className="space-y-8 pb-32 md:pb-0">
      <div className="container mx-auto px-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <h2 className="text-3xl font-medium tracking-tight">Job applications tracker</h2>
            </div>
            <div className="w-full md:flex-1 md:max-w-md">
              <AddApplicationForm 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn(
                "font-medium",
                currentCount >= maxRows && "text-destructive",
                currentCount >= maxRows * 0.8 && currentCount < maxRows && "text-orange-600 dark:text-orange-400",
                currentCount < maxRows * 0.8 && "text-muted-foreground font-normal"
              )}>
                {currentCount} of {hasUnlimitedRows ? "unlimited" : maxRows} tracked
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
            <div className="text-center py-12 text-muted-foreground text-lg">
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

