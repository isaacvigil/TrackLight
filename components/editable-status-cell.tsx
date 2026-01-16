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
import posthog from "posthog-js";
import { Bookmark, Check, MessagesSquare, X, File, type LucideIcon } from "lucide-react";

interface EditableStatusCellProps {
  applicationId: string;
  value: string;
}

const statusOptions = [
  { value: "bookmarked", label: "Bookmarked", icon: Bookmark },
  { value: "applied", label: "Applied", icon: Check },
  { value: "interviewing", label: "Interviewing", icon: MessagesSquare },
  { value: "no_match", label: "No match", icon: X },
  { value: "offer", label: "Offer", icon: File },
];

const statusColors: Record<string, string> = {
  bookmarked: "text-muted-foreground",
  applied: "text-blue-600 dark:text-blue-400",
  interviewing: "text-purple-600 dark:text-purple-400",
  no_match: "text-destructive",
  offer: "text-green-600 dark:text-green-400",
};

export function EditableStatusCell({ applicationId, value }: EditableStatusCellProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(newValue: string) {
    if (newValue === value) return;

    const previousStatus = value;
    setIsSaving(true);
    try {
      await updateJobApplicationField(applicationId, "applicationStatus", newValue);

      // Track status change
      posthog.capture('application_status_changed', {
        previous_status: previousStatus,
        new_status: newValue,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const currentOption = statusOptions.find((opt) => opt.value === value);
  const CurrentIcon = currentOption?.icon;

  return (
    <Select value={value} onValueChange={handleChange} disabled={isSaving}>
      <SelectTrigger
        className={cn(
          "h-10 w-full border-0 focus:ring-0 focus-visible:ring-0 text-base font-normal rounded-none !bg-transparent dark:!bg-transparent",
          statusColors[value] || "text-primary"
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-2 text-base font-normal">
            {CurrentIcon && <CurrentIcon className={cn("size-4", statusColors[value] || "text-primary")} />}
            {currentOption?.label || value}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <span className={cn("flex items-center gap-2 text-base font-normal", statusColors[option.value])}>
                <Icon className={cn("size-4", statusColors[option.value])} />
                {option.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

