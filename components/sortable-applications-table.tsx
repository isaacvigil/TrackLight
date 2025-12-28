"use client"

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { EditableCell } from "@/components/editable-cell";
import { EditableStatusCell } from "@/components/editable-status-cell";
import { EditableRemoteStatusCell } from "@/components/editable-remote-status-cell";
import { NotesDialog } from "@/components/notes-dialog";
import type { JobApplication } from "@/db/schema";
import { cn } from "@/lib/utils";

interface SortableApplicationsTableProps {
  applications: JobApplication[];
}

type SortField = 
  | "company" 
  | "role" 
  | "location" 
  | "remoteStatus" 
  | "salary" 
  | "applicationStatus" 
  | "appliedDate" 
  | "statusChangeDate";

type SortDirection = "asc" | "desc" | null;

export function SortableApplicationsTable({ applications }: SortableApplicationsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const sortedApplications = useMemo(() => {
    if (!sortField || !sortDirection) {
      return applications;
    }

    return [...applications].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/empty values - always sort them to the end
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      // Date sorting
      if (sortField === "appliedDate" || sortField === "statusChangeDate") {
        const aDate = aValue ? new Date(aValue).getTime() : 0;
        const bDate = bValue ? new Date(bValue).getTime() : 0;
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }

      // String sorting (case-insensitive)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [applications, sortField, sortDirection]);

  function SortableHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const isActive = sortField === field;
    
    return (
      <TableHead 
        className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          <div className="flex flex-col ml-1">
            <ChevronUp 
              className={cn(
                "size-3 -mb-1",
                isActive && sortDirection === "asc" 
                  ? "text-foreground" 
                  : "text-muted-foreground/30"
              )}
            />
            <ChevronDown 
              className={cn(
                "size-3",
                isActive && sortDirection === "desc" 
                  ? "text-foreground" 
                  : "text-muted-foreground/30"
              )}
            />
          </div>
        </div>
      </TableHead>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader field="company">Company</SortableHeader>
          <SortableHeader field="role">Role</SortableHeader>
          <SortableHeader field="location">Location</SortableHeader>
          <SortableHeader field="remoteStatus">Remote</SortableHeader>
          <SortableHeader field="salary">Salary</SortableHeader>
          <SortableHeader field="applicationStatus">Status</SortableHeader>
          <SortableHeader field="appliedDate">Date Applied</SortableHeader>
          <SortableHeader field="statusChangeDate">Status Changed on</SortableHeader>
          <TableHead>Link</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedApplications.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="text-center text-muted-foreground">
              No applications yet. Start tracking your job opportunities!
            </TableCell>
          </TableRow>
        ) : (
          sortedApplications.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium p-0">
                <EditableCell
                  applicationId={app.id}
                  field="company"
                  value={app.company}
                  className="font-medium"
                />
              </TableCell>
              <TableCell className="p-0 -ml-px">
                <EditableCell
                  applicationId={app.id}
                  field="role"
                  value={app.role}
                />
              </TableCell>
              <TableCell className="p-0 -ml-px">
                <EditableCell
                  applicationId={app.id}
                  field="location"
                  value={app.location}
                />
              </TableCell>
              <TableCell className="p-0 -ml-px">
                <EditableRemoteStatusCell
                  applicationId={app.id}
                  value={app.remoteStatus}
                />
              </TableCell>
              <TableCell className="p-0 -ml-px">
                <EditableCell
                  applicationId={app.id}
                  field="salary"
                  value={app.salary}
                />
              </TableCell>
              <TableCell className="p-0 -ml-px">
                <EditableStatusCell
                  applicationId={app.id}
                  value={app.applicationStatus}
                />
              </TableCell>
              <TableCell className="text-base">
                {app.appliedDate 
                  ? new Date(app.appliedDate).toLocaleDateString()
                  : "—"
                }
              </TableCell>
              <TableCell className="text-base">
                {app.statusChangeDate 
                  ? new Date(app.statusChangeDate).toLocaleDateString()
                  : "—"
                }
              </TableCell>
              <TableCell>
                {app.jobUrl ? (
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <NotesDialog 
                  applicationId={app.id}
                  companyName={app.company}
                />
              </TableCell>
              <TableCell className="text-right">
                <DeleteApplicationButton applicationId={app.id} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

