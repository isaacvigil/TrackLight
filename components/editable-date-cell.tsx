"use client"

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { updateJobApplicationField } from "@/app/actions/job-applications";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EditableDateCellProps {
  applicationId: string;
  field: "appliedDate" | "statusChangeDate";
  value: Date | null;
  applicationStatus: string;
}

export function EditableDateCell({ 
  applicationId, 
  field, 
  value,
  applicationStatus
}: EditableDateCellProps) {
  const [date, setDate] = useState<Date | undefined>(value || undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with prop when it changes (e.g., when status is updated)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`EditableDateCell ${field} value changed:`, value);
    }
    setDate(value || undefined);
  }, [value, field]);

  async function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate);
    setIsSaving(true);
    
    try {
      await updateJobApplicationField(
        applicationId,
        field,
        selectedDate || null
      );
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update date:", error);
      alert("Failed to update date. Please try again.");
      setDate(value || undefined);
    } finally {
      setIsSaving(false);
    }
  }

  // Check if date is more than 30 days old (but not for no_match or accepted statuses)
  const isOlderThan30Days = date && 
    applicationStatus !== "no_match" && 
    applicationStatus !== "accepted" &&
    (Date.now() - date.getTime()) > (30 * 24 * 60 * 60 * 1000);

  const fieldLabel = field === "appliedDate" ? "Applied date" : "Status change date";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Edit ${fieldLabel}: ${date ? format(date, "d MMM yyyy") : "not set"}`}
          className={cn(
            "h-10 w-full flex items-center px-2 text-base cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            !date && "text-muted-foreground",
            isOlderThan30Days && "text-orange-600 dark:text-orange-400",
            isSaving && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => {
            if (!isSaving) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isSaving) {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <CalendarIcon className={cn(
            "mr-2 size-4 flex-shrink-0",
            isOlderThan30Days && "text-orange-600 dark:text-orange-400"
          )} aria-hidden="true" />
          <span>
            {date ? format(date, "d MMM yyyy") : "—"}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" side="bottom">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

