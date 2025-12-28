"use client"

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateJobApplicationField } from "@/app/actions/job-applications";
import { cn } from "@/lib/utils";

interface EditableStatusCellProps {
  applicationId: string;
  value: string;
}

const statusOptions = [
  { value: "bookmarked", label: "Bookmarked" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "no_match", label: "No match" },
  { value: "accepted", label: "Accepted!" },
];

const statusColors: Record<string, string> = {
  bookmarked: "text-slate-700 dark:text-slate-300",
  applied: "text-blue-700 dark:text-blue-300",
  interviewing: "text-purple-700 dark:text-purple-300",
  no_match: "text-red-700 dark:text-red-300",
  accepted: "text-emerald-700 dark:text-emerald-300",
};

export function EditableStatusCell({ applicationId, value }: EditableStatusCellProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(newValue: string) {
    if (newValue === value) return;

    setIsSaving(true);
    try {
      await updateJobApplicationField(applicationId, "applicationStatus", newValue);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const currentLabel = statusOptions.find((opt) => opt.value === value)?.label || value;

  return (
    <Select value={value} onValueChange={handleChange} disabled={isSaving}>
      <SelectTrigger
        className={cn(
          "h-10 w-full border border-border focus:ring-0 text-base font-normal rounded-none !bg-transparent dark:!bg-transparent hover:!bg-transparent",
          statusColors[value] || "text-primary"
        )}
      >
        <SelectValue>
          <span className="text-base font-normal">{currentLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className={cn("text-base font-normal", statusColors[option.value])}>
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

