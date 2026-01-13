"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SquarePen } from "lucide-react";
import { updateJobApplicationNotes } from "@/app/actions/job-applications";
import { useAuth } from "@clerk/nextjs";
import posthog from "posthog-js";
import { TiptapEditor, TiptapHelpDialog } from "@/components/tiptap-editor";

interface NotesDialogProps {
  applicationId: string;
  role: string;
  companyName: string;
  initialNotes: string | null;
}

export function NotesDialog({ applicationId, role, companyName, initialNotes }: NotesDialogProps) {
  const { has } = useAuth();
  const hasNotesAccess = has ? has({ feature: 'notes' }) : false;
  
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = notes !== (initialNotes || "");

  async function saveNotes() {
    setError(null);
    setIsSaving(true);

    try {
      await updateJobApplicationNotes({
        id: applicationId,
        notes: notes.trim() || null,
      });

      // Track notes saved event
      posthog.capture('notes_saved', {
        company: companyName,
        role,
        notes_length: notes.trim().length,
      });

      // Close the modal after successful save
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenChange(newOpen: boolean) {
    if (!newOpen && hasChanges) {
      // Save notes when closing if they changed
      try {
        await updateJobApplicationNotes({
          id: applicationId,
          notes: notes.trim() || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save notes");
        // Keep dialog open if save failed
        return;
      }
    }
    
    if (!newOpen) {
      setError(null);
    }
    
    setOpen(newOpen);
  }

  // Track when free user views the notes upgrade prompt
  function handleUpgradeDialogOpen(isOpen: boolean) {
    if (isOpen && !hasNotesAccess) {
      posthog.capture('notes_upgrade_prompt_viewed', {
        company: companyName,
        role,
      });
    }
  }

  if (!hasNotesAccess) {
    return (
      <TooltipProvider>
        <Dialog onOpenChange={handleUpgradeDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 px-2" aria-label="Add notes (Pro feature)">
                  <SquarePen className="size-5" aria-hidden="true" />
                  <span className="sr-only">Add notes</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add notes (Pro)</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notes · Pro Feature</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-base text-muted-foreground mb-4">
               Add important details, follow-up tasks, and interview notes for each application.
              </p>
              <Button asChild className="w-full">
                <a href="/pricing">Upgrade to Pro</a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 px-2 relative"
                aria-label={initialNotes && initialNotes.trim() ? "Edit notes" : "Add notes"}
              >
                <SquarePen className="size-5" aria-hidden="true" />
                {initialNotes && initialNotes.trim() && (
                  <span 
                    className="absolute top-0.5 right-0.5 size-2 bg-primary rounded-full"
                    aria-hidden="true"
                  />
                )}
                <span className="sr-only">
                  {initialNotes && initialNotes.trim() ? "Edit notes" : "Add notes"}
                </span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{initialNotes && initialNotes.trim() ? "Edit notes" : "Add notes"}</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent 
          className="!max-w-5xl w-full sm:!h-[60vh] sm:!max-h-[90vh]"
          style={{
            WebkitUserSelect: 'text',
            userSelect: 'text',
          } as React.CSSProperties}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Notes for {role} at {companyName}</DialogTitle>
          </DialogHeader>

          <div 
            className="space-y-4 overflow-y-auto flex-1 min-h-0"
            style={{
              WebkitUserSelect: 'text',
              userSelect: 'text',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'auto',
            } as React.CSSProperties}
          >
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <TiptapEditor
              content={notes}
              onChange={setNotes}
              placeholder="Add your notes here..."
            />
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <TiptapHelpDialog />
            <Button
              onClick={saveNotes}
              disabled={!hasChanges || isSaving}
              className="ml-auto min-w-[120px]"
              type="button"
            >
              {isSaving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

