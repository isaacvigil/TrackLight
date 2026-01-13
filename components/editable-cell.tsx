"use client"

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { updateJobApplicationField } from "@/app/actions/job-applications";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  applicationId: string;
  field: string;
  value: string | null;
  className?: string;
}

export function EditableCell({ 
  applicationId, 
  field, 
  value,
  className 
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  async function handleSave() {
    if (editValue === (value || "")) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateJobApplicationField(
        applicationId,
        field,
        editValue.trim() || null
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update:", error);
      alert("Failed to update. Please try again.");
      setEditValue(value || "");
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value || "");
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="h-10 text-base rounded-none border-0 focus-visible:ring-0"
      />
    );
  }

  const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      aria-label={`Edit ${fieldLabel}: ${value || "empty"}`}
      className={cn(
        "cursor-pointer rounded-none px-2 py-1 h-10 flex items-center text-base",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        className
      )}
    >
      {value || "—"}
    </div>
  );
}

