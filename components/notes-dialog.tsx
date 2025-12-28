"use client"

import { useState, useEffect } from "react";
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
import { SquarePen, Trash2, Edit2, Plus, X } from "lucide-react";
import { createNote, getNotesForApplication, updateNote, deleteNote } from "@/app/actions/notes";
import type { Note } from "@/db/schema";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface NotesDialogProps {
  applicationId: string;
  companyName: string;
}

export function NotesDialog({ applicationId, companyName }: NotesDialogProps) {
  const { has } = useAuth();
  const hasNotesAccess = has ? has({ feature: 'notes' }) : false;
  
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load notes on mount to show badge count immediately
  useEffect(() => {
    if (hasNotesAccess) {
      loadNotes();
    }
  }, [hasNotesAccess]);

  // Reload notes when dialog opens to get fresh data
  useEffect(() => {
    if (open && hasNotesAccess) {
      loadNotes();
    }
  }, [open]);

  async function loadNotes() {
    if (!hasNotesAccess) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await getNotesForApplication(applicationId);
      setNotes(fetchedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNoteContent.trim()) return;
    
    setIsAddingNote(true);
    setError(null);
    try {
      await createNote({
        jobApplicationId: applicationId,
        content: newNoteContent.trim(),
      });
      setNewNoteContent("");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleUpdateNote(noteId: string) {
    if (!editingContent.trim()) return;
    
    setError(null);
    try {
      await updateNote({
        id: noteId,
        content: editingContent.trim(),
      });
      setEditingNoteId(null);
      setEditingContent("");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setError(null);
    try {
      await deleteNote({ id: noteId });
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  function startEditing(note: Note) {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  }

  function cancelEditing() {
    setEditingNoteId(null);
    setEditingContent("");
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
              Track important details, follow-up tasks, and interview notes with unlimited notes for each application.
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 px-2 relative">
          <SquarePen className="size-5" />
          {notes.length > 0 && (
            <span className="absolute -top-1 -right-1 size-4 text-[10px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {notes.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notes for {companyName}</DialogTitle>
          <DialogDescription>
            Add notes to track important details about this application.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No notes yet. Add your first note below!
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg border bg-card"
              >
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-[100px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editingContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                        {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                          <span className="ml-2">(edited)</span>
                        )}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => startEditing(note)}
                        >
                          <Edit2 className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <Textarea
            placeholder="Add a new note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[100px]"
            disabled={isAddingNote}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || isAddingNote}
            >
              <Plus className="size-4 mr-2" />
              {isAddingNote ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

