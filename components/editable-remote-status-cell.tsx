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

  const currentValue = value || remoteStatusOptions[0].value;
  const currentLabel = remoteStatusOptions.find((opt) => opt.value === currentValue)?.label || currentValue;

  return (
    <Select value={currentValue} onValueChange={handleChange} disabled={isSaving}>
      <SelectTrigger className="h-10 w-full border-0 focus:ring-0 focus-visible:ring-0 text-base font-normal rounded-none !bg-transparent dark:!bg-transparent hover:!bg-muted/50 transition-colors">
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

