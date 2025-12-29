"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SquarePen } from "lucide-react";
import { updateJobApplicationNotes } from "@/app/actions/job-applications";
import { useAuth } from "@clerk/nextjs";

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

  async function handleOpenChange(newOpen: boolean) {
    if (!newOpen && notes !== (initialNotes || "")) {
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

  if (!hasNotesAccess) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-10 w-10 px-2">
            <SquarePen className="size-5" />
          </Button>
        </DialogTrigger>
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
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 px-2 relative">
          <SquarePen className="size-5" />
          {initialNotes && initialNotes.trim() && (
            <span className="absolute top-0.5 right-0.5 size-2 bg-primary rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Notes for {role} at {companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Textarea
            placeholder="Add your notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[400px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

