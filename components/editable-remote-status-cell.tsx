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

interface EditableRemoteStatusCellProps {
  applicationId: string;
  value: string | null;
}

const remoteStatusOptions = [
  { value: "Hybrid", label: "Hybrid" },
  { value: "Remote", label: "Remote" },
  { value: "On site", label: "On site" },
];

// Normalize legacy/variant remote status values to standard options
function normalizeRemoteStatus(value: string | null): string {
  if (!value) return remoteStatusOptions[0].value;
  
  const normalized = value.toLowerCase().trim();
  
  // Map "Remote Friendly", "Remote-Friendly", etc. to "Remote"
  if (normalized.includes("remote") && !normalized.includes("hybrid")) {
    return "Remote";
  }
  
  // Map "Hybrid" variants
  if (normalized.includes("hybrid")) {
    return "Hybrid";
  }
  
  // Map "On site", "In-office", "Office", etc.
  if (normalized.includes("on site") || 
      normalized.includes("on-site") || 
      normalized.includes("in-office") || 
      normalized.includes("in office") ||
      normalized.includes("office")) {
    return "On site";
  }
  
  // Default to the original value if no match
  return value;
}

export function EditableRemoteStatusCell({ applicationId, value }: EditableRemoteStatusCellProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(newValue: string) {
    if (newValue === value) return;

    setIsSaving(true);
    try {
      await updateJobApplicationField(applicationId, "remoteStatus", newValue);
    } catch (error) {
      console.error("Failed to update remote status:", error);
      alert("Failed to update remote status. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const normalizedValue = normalizeRemoteStatus(value);
  const currentValue = normalizedValue;
  const currentLabel = remoteStatusOptions.find((opt) => opt.value === currentValue)?.label || currentValue;

  return (
    <Select value={currentValue} onValueChange={handleChange} disabled={isSaving}>
      <SelectTrigger className="h-10 w-full border-0 focus:ring-0 focus-visible:ring-0 text-base font-normal rounded-none !bg-transparent dark:!bg-transparent">
        <SelectValue>
          <span className="text-base font-normal">{currentLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {remoteStatusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="text-base font-normal">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

