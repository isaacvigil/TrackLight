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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { EditableCell } from "@/components/editable-cell";
import { EditableStatusCell } from "@/components/editable-status-cell";
import { EditableRemoteStatusCell } from "@/components/editable-remote-status-cell";
import { EditableDateCell } from "@/components/editable-date-cell";
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

interface SortableHeaderProps {
  field: SortField;
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortableHeader({ field, children, className, isActive, sortDirection, onSort }: SortableHeaderProps) {
  const getSortLabel = () => {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
    if (!isActive) return `Sort by ${fieldName}`;
    return `Sort by ${fieldName} (currently ${sortDirection === "asc" ? "ascending" : "descending"})`;
  };

  const isSticky = field === "company";

  return (
    <TableHead className={cn(
      className,
      isSticky && "sticky left-0 z-10 backdrop-blur-xs"
    )}
    style={isSticky ? { backgroundColor: 'rgba(0, 14, 31, 0.8)' } : undefined}>
      <button
        onClick={() => onSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort(field);
          }
        }}
        className={cn(
          "cursor-pointer select-none w-full text-left flex items-center gap-1 p-2 -m-2 rounded",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label={getSortLabel()}
        aria-sort={
          isActive 
            ? sortDirection === "asc" 
              ? "ascending" 
              : "descending"
            : "none"
        }
      >
        {children}
        <div className="flex flex-col ml-1" aria-hidden="true">
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
      </button>
    </TableHead>
  );
}

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
      const aValue: unknown = a[sortField];
      const bValue: unknown = b[sortField];

      // Handle null/empty values - always sort them to the end
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      // Date sorting
      if (sortField === "appliedDate" || sortField === "statusChangeDate") {
        const aDate = aValue ? new Date(aValue as string | Date).getTime() : 0;
        const bDate = bValue ? new Date(bValue as string | Date).getTime() : 0;
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

  return (
    <Table>
      <caption className="sr-only">
        Job applications list with {applications.length} {applications.length === 1 ? 'application' : 'applications'}
      </caption>
      <TableHeader className="mb-2">
        <TableRow>
          <SortableHeader field="company" className="w-[180px]" isActive={sortField === "company"} sortDirection={sortDirection} onSort={handleSort}>Company</SortableHeader>
          <SortableHeader field="role" className="w-[200px]" isActive={sortField === "role"} sortDirection={sortDirection} onSort={handleSort}>Role</SortableHeader>
          <SortableHeader field="location" className="w-[150px]" isActive={sortField === "location"} sortDirection={sortDirection} onSort={handleSort}>Location</SortableHeader>
          <SortableHeader field="remoteStatus" className="w-[110px]" isActive={sortField === "remoteStatus"} sortDirection={sortDirection} onSort={handleSort}>Remote</SortableHeader>
          <SortableHeader field="salary" className="w-[130px]" isActive={sortField === "salary"} sortDirection={sortDirection} onSort={handleSort}>Salary</SortableHeader>
          <SortableHeader field="applicationStatus" className="w-[140px]" isActive={sortField === "applicationStatus"} sortDirection={sortDirection} onSort={handleSort}>Status</SortableHeader>
          <SortableHeader field="appliedDate" className="w-[115px]" isActive={sortField === "appliedDate"} sortDirection={sortDirection} onSort={handleSort}>Applied on</SortableHeader>
          <SortableHeader field="statusChangeDate" className="w-[120px]" isActive={sortField === "statusChangeDate"} sortDirection={sortDirection} onSort={handleSort}>Status changed</SortableHeader>
          <TableHead className="text-right w-[145px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedApplications.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
              No applications match your search.
            </TableCell>
          </TableRow>
        ) : (
          sortedApplications.map((app) => (
            <TableRow key={app.id} className="group hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium p-0 sticky left-0 z-10 backdrop-blur-xs bg-[rgba(0,14,31,0.8)] group-hover:!bg-[rgb(19,27,35)] transition-colors">
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
              <TableCell className="p-0 -ml-px">
                <EditableDateCell
                  applicationId={app.id}
                  field="appliedDate"
                  value={app.appliedDate}
                  applicationStatus={app.applicationStatus}
                />
              </TableCell>
              <TableCell className="p-0 -ml-px">
                <EditableDateCell
                  applicationId={app.id}
                  field="statusChangeDate"
                  value={app.statusChangeDate}
                  applicationStatus={app.applicationStatus}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <NotesDialog 
                    applicationId={app.id}
                    role={app.role}
                    companyName={app.company}
                    initialNotes={app.notes}
                  />
                  {app.jobUrl ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 px-2"
                            asChild
                          >
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open job posting"
                            >
                              <Link2 className="size-6" aria-hidden="true" />
                              <span className="sr-only">
                                Open job posting for {app.role} at {app.company}
                              </span>
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open job posting</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="h-10 w-10" />
                  )}
                  <DeleteApplicationButton
                    applicationId={app.id}
                    company={app.company}
                    role={app.role}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

