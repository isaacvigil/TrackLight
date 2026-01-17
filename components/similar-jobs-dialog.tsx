"use client"

import { useState } from "react"
import { Sparkle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Bookmark, BookmarkCheck, RefreshCw } from "lucide-react"
import { findSimilarJobs, type SimilarJob } from "@/app/actions/job-applications"
import { createJobApplicationFromSimilarJob } from "@/app/actions/job-applications"

interface SimilarJobsDialogProps {
  role: string
  company: string
  location: string | null
  remoteStatus: string | null
}

export function SimilarJobsDialog({
  role,
  company,
  location,
  remoteStatus,
}: SimilarJobsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [jobs, setJobs] = useState<SimilarJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<number>>(new Set())

  async function handleSearch() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await findSimilarJobs({
        role,
        company,
        location: location || undefined,
        remoteStatus: remoteStatus || undefined,
      })

      setJobs(result.jobs)
    } catch (err) {
      console.error("Failed to find similar jobs:", err)
      setError(err instanceof Error ? err.message : "Failed to find similar jobs. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open && jobs.length === 0) {
      // Trigger search when dialog opens for the first time
      handleSearch()
    }
  }

  async function handleBookmark(job: SimilarJob, index: number) {
    try {
      await createJobApplicationFromSimilarJob({
        company: job.company,
        role: job.role,
        location: job.location.trim() || null,
        remoteStatus: job.remoteStatus.trim() || null,
        salary: null,
        jobUrl: job.jobUrl.trim() || null,
        sourceJobRole: role,
        sourceJobCompany: company,
      })
      
      // Mark as bookmarked
      setBookmarkedJobs(prev => new Set(prev).add(index))
    } catch (err) {
      console.error("Failed to bookmark job:", err)
      alert(err instanceof Error ? err.message : "Failed to bookmark job. Please try again.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 px-2"
                aria-label="Find similar jobs"
              >
                <Sparkle className="size-6" aria-hidden="true" />
                <span className="sr-only">
                  Find similar jobs to {role} at {company}
                </span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Find similar jobs</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="!w-screen !h-screen !max-w-none !max-h-none !top-0 !left-0 !translate-x-0 !translate-y-0 !m-0 !rounded-none overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Similar job opportunities to {role} at {company}</DialogTitle>
          <DialogDescription>
            Jobs similar to {role} at {company}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-muted-foreground">
                Searching for similar jobs...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="rounded-lg bg-destructive/10 p-6 text-destructive max-w-md">
              <p className="mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <div className="flex-1 overflow-auto pb-8">
            <div className="container mx-auto px-4">
              <div className="overflow-x-auto -mx-4">
                <div className="min-w-[1100px] px-4">
                  <Table>
                    <caption className="sr-only">
                      Similar job opportunities - {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                    </caption>
                    <TableHeader className="mb-2">
                      <TableRow>
                        <TableHead className="w-[180px]">Company</TableHead>
                        <TableHead className="w-[200px]">Role</TableHead>
                        <TableHead className="w-[150px]">Location</TableHead>
                        <TableHead className="w-[110px]">Remote</TableHead>
                        <TableHead className="w-[130px]">Salary</TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job, index) => (
                        <TableRow key={index} className="group hover:bg-gray-800 transition-colors">
                          <TableCell className="font-medium p-0">
                            <div className="px-2 py-1 h-10 flex items-center text-base">
                              {job.company}
                            </div>
                          </TableCell>
                          <TableCell className="p-0 -ml-px">
                            <div className="px-2 py-1 h-10 flex items-center text-base">
                              {job.role}
                            </div>
                          </TableCell>
                          <TableCell className="p-0 -ml-px">
                            <div className="px-2 py-1 h-10 flex items-center text-base">
                              {job.location && job.location.trim() ? job.location : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="p-0 -ml-px">
                            <div className="px-2 py-1 h-10 flex items-center text-base">
                              {job.remoteStatus && job.remoteStatus.trim() ? job.remoteStatus : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="p-0 -ml-px">
                            <div className="px-2 py-1 h-10 flex items-center text-base">
                              —
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-10 w-10 px-2"
                                      onClick={() => handleBookmark(job, index)}
                                      disabled={bookmarkedJobs.has(index)}
                                      aria-label={bookmarkedJobs.has(index) ? "Already bookmarked" : "Bookmark this job"}
                                    >
                                      {bookmarkedJobs.has(index) ? (
                                        <BookmarkCheck className="size-6" aria-hidden="true" />
                                      ) : (
                                        <Bookmark className="size-6" aria-hidden="true" />
                                      )}
                                      <span className="sr-only">
                                        {bookmarkedJobs.has(index) ? "Bookmarked" : "Bookmark"} {job.role} at {job.company}
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{bookmarkedJobs.has(index) ? "Bookmarked" : "Bookmark"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-10 w-10 px-2"
                                      onClick={() => {
                                        // TODO: Find similar to this job
                                        console.log('Find similar to:', job)
                                      }}
                                      aria-label="Find similar jobs to this"
                                    >
                                      <RefreshCw className="size-6" aria-hidden="true" />
                                      <span className="sr-only">
                                        Find jobs similar to {job.role} at {job.company}
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Find something else</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
