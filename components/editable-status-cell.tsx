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
  bookmarked: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  interviewing: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  no_match: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
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
          "h-8 w-full border-0 focus:ring-0",
          statusColors[value] || "bg-primary/10 text-primary"
        )}
      >
        <SelectValue>
          <span className="text-xs font-medium">{currentLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className={cn("text-xs font-medium", statusColors[option.value])}>
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

