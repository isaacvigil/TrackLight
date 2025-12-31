"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createJobApplication } from "@/app/actions/job-applications";
import Link from "next/link";
import { AlertCircle, Search, X, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddApplicationFormProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AddApplicationForm({ searchQuery, onSearchChange }: AddApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const desktopFormRef = useRef<HTMLFormElement>(null);
  const mobileFormRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function validateUrl(url: string): boolean {
    if (!url.trim()) {
      setUrlError("Please enter a URL");
      return false;
    }
    
    try {
      new URL(url);
      setUrlError(null);
      return true;
    } catch {
      setUrlError("Please enter a valid URL");
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const jobUrl = formData.get("jobUrl") as string;
    
    // Validate URL before submitting
    if (!validateUrl(jobUrl)) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setWarning(null);
    
    const input = {
      jobUrl: formData.get("jobUrl") as string,
    };

    try {
      const result = await createJobApplication(input);
      
      // Check if this is a duplicate application
      if (result.isDuplicate) {
        toast.warning("Duplicate Application", {
          description: "You've already applied to this job. A new entry has been added anyway.",
          duration: 5000,
        });
      }
      
      // Check if extraction failed (placeholder values were used)
      // Only show warning if BOTH company and role couldn't be extracted
      if (result.company?.includes("(Unable to extract, input manually)") && result.role?.includes("(Unable to extract, input manually)")) {
        setWarning("Could not extract job details from this page. Please update the company and role by clicking on them in the table.");
      }
      
      // Reset both forms on success (desktop and mobile)
      desktopFormRef.current?.reset();
      mobileFormRef.current?.reset();
      setUrlError(null);
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
    <>
      {/* Desktop: normal positioning */}
      <div className="hidden md:block space-y-2">
        {isSearchMode ? (
          // Search mode
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={toggleSearchMode}
              className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
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
                className="pl-4 pr-4 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
              />
            </div>
          </div>
        ) : (
          // Add mode
          <form ref={desktopFormRef} onSubmit={handleSubmit} noValidate>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={toggleSearchMode}
                className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
              >
                <Search className="size-5" />
                <span className="sr-only">Search</span>
              </Button>
              <div className="relative flex-1">
                <Input
                  name="jobUrl"
                  type="url"
                  placeholder="Paste job post link here..."
                  disabled={isSubmitting}
                  onChange={(e) => {
                    if (urlError) {
                      validateUrl(e.target.value);
                    }
                  }}
                  className="pl-4 pr-20 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  variant="ghost"
                  className="absolute right-1 top-1 h-10 rounded-3xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
                {urlError && !isSubmitting && (
                  <p className="text-sm text-destructive absolute -top-6 left-0 right-0 text-left pl-4">{urlError}</p>
                )}
              </div>
            </div>
          </form>
        )}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-destructive font-medium text-base">{error}</p>
                {isLimitError && (
                  <Link href="/pricing" className="text-primary hover:underline mt-1 inline-block text-base">
                    View pricing plans →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        {warning && (
          <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3 text-sm">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-orange-900 dark:text-orange-200 font-medium">{warning}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: floating at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3 space-y-2">
          {isSearchMode ? (
            // Search mode
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline"
                onClick={toggleSearchMode}
                className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
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
                  className="pl-4 pr-4 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
                />
              </div>
            </div>
          ) : (
            // Add mode
            <form ref={mobileFormRef} onSubmit={handleSubmit} noValidate>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={toggleSearchMode}
                  className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
                >
                  <Search className="size-5" />
                  <span className="sr-only">Search</span>
                </Button>
                <div className="relative flex-1">
                  <Input
                    name="jobUrl"
                    type="url"
                    placeholder="Paste job post link here..."
                    disabled={isSubmitting}
                    onChange={(e) => {
                      if (urlError) {
                        validateUrl(e.target.value);
                      }
                    }}
                    className="pl-4 pr-20 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    variant="ghost"
                    className="absolute right-1 top-1 h-10 rounded-3xl"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  {urlError && !isSubmitting && (
                    <p className="text-sm text-destructive absolute -top-6 left-0 right-0 text-left pl-4">{urlError}</p>
                  )}
                </div>
              </div>
            </form>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-destructive font-medium text-base">{error}</p>
                  {isLimitError && (
                    <Link href="/pricing" className="text-primary hover:underline mt-1 inline-block text-base">
                      View pricing plans →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
          {warning && (
            <div className="rounded-md bg-orange-500/10 border border-orange-500/20 p-3 text-sm">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-orange-900 dark:text-orange-200 font-medium">{warning}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

