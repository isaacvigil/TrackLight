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
}

export function EditableDateCell({ 
  applicationId, 
  field, 
  value 
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "h-10 w-full flex items-center px-2 text-base cursor-pointer hover:bg-muted/50 transition-colors",
            !date && "text-muted-foreground",
            isSaving && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => {
            if (!isSaving) {
              setIsOpen(true);
            }
          }}
        >
          <CalendarIcon className="mr-2 size-4 flex-shrink-0" />
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

