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
import { SquarePen, Pencil } from "lucide-react";
import { updateJobApplicationNotes } from "@/app/actions/job-applications";
import { useAuth } from "@clerk/nextjs";

// Utility function to detect URLs and convert them to clickable links
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateJobApplicationNotes({
        id: applicationId,
        notes: notes.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset edit mode and notes when closing
      setIsEditing(false);
      setNotes(initialNotes || "");
      setError(null);
    } else {
      // If opening with no notes, go straight to edit mode
      if (!initialNotes || !initialNotes.trim()) {
        setIsEditing(true);
      }
    }
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
            <DialogTitle>Notes - Pro Feature</DialogTitle>
            <DialogDescription>
              Upgrade to Pro to add notes to your job applications.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Track important details, follow-up tasks, and interview notes for each application.
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

          {isEditing ? (
            <>
              <Textarea
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[400px]"
              />

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div 
                className="min-h-[400px] max-h-[600px] overflow-y-auto rounded-md border border-input bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsEditing(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsEditing(true);
                  }
                }}
              >
                {notes ? (
                  <p className="whitespace-pre-wrap text-base leading-relaxed">
                    {linkifyText(notes)}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No notes added yet. Click to add notes.</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4 mr-2" />
                  Edit
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

