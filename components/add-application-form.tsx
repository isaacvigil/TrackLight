"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createJobApplication } from "@/app/actions/job-applications";
import Link from "next/link";
import { AlertCircle, Search, X } from "lucide-react";

interface AddApplicationFormProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AddApplicationForm({ searchQuery, onSearchChange }: AddApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Focus search input when entering search mode
  useEffect(() => {
    if (isSearchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchMode]);

  function toggleSearchMode() {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      // Clear search when exiting search mode
      onSearchChange("");
    }
  }

  return (
    <div className="space-y-2">
      {isSearchMode ? (
        // Search mode
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline"
            onClick={toggleSearchMode}
            className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 dark:bg-input/30"
          >
            <X className="size-5" />
            <span className="sr-only">Close search</span>
          </Button>
          <div className="relative flex-1">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by company, role, location, status..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-4 pr-4 rounded-3xl h-12"
            />
          </div>
        </div>
      ) : (
        // Add mode
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={toggleSearchMode}
              className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 dark:bg-input/30"
            >
              <Search className="size-5" />
              <span className="sr-only">Search</span>
            </Button>
            <div className="relative flex-1">
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
          </div>
        </form>
      )}
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

