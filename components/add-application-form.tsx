"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createJobApplication } from "@/app/actions/job-applications";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function AddApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const input = {
      jobUrl: formData.get("jobUrl") as string,
    };

    try {
      await createJobApplication(input);
      // Reset form on success using ref
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add application");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLimitError = error?.includes("reached your limit");

  return (
    <div className="space-y-2">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            name="jobUrl"
            type="url"
            placeholder="Paste job post link here..."
            required
            disabled={isSubmitting}
            className="pl-4 pr-20 rounded-3xl h-12"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting}
            variant="ghost"
            className="absolute right-1 top-1 h-10 rounded-3xl"
          >
            {isSubmitting ? "Extracting job data..." : "Add"}
          </Button>
        </div>
      </form>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-destructive font-medium">{error}</p>
              {isLimitError && (
                <Link href="/pricing" className="text-primary hover:underline mt-1 inline-block">
                  View pricing plans →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

