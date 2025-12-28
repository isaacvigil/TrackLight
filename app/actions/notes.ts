"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notes, jobApplications } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

// Zod schemas for validation
const createNoteSchema = z.object({
  jobApplicationId: z.string().min(1, "Job application ID is required"),
  content: z.string().min(1, "Note content cannot be empty").max(5000, "Note is too long"),
});

const updateNoteSchema = z.object({
  id: z.string().min(1, "Note ID is required"),
  content: z.string().min(1, "Note content cannot be empty").max(5000, "Note is too long"),
});

const deleteNoteSchema = z.object({
  id: z.string().min(1, "Note ID is required"),
});

type CreateNoteInput = z.infer<typeof createNoteSchema>;
type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;

/**
 * Creates a new note for a job application
 * Verifies that the job application belongs to the authenticated user
 */
export async function createNote(input: CreateNoteInput) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check notes feature access
  if (!has({ feature: 'notes' })) {
    throw new Error("Upgrade to Pro to access notes feature");
  }

  // Validate input
  const validatedData = createNoteSchema.parse(input);

  // Verify the job application exists and belongs to the user
  const application = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.id, validatedData.jobApplicationId),
        eq(jobApplications.userId, userId)
      )
    )
    .limit(1);

  if (application.length === 0) {
    throw new Error("Job application not found or you don't have permission");
  }

  // Create the note
  const result = await db
    .insert(notes)
    .values({
      jobApplicationId: validatedData.jobApplicationId,
      content: validatedData.content,
    })
    .returning();

  revalidatePath("/track");
  return result[0];
}

/**
 * Gets all notes for a specific job application
 * Verifies that the job application belongs to the authenticated user
 */
export async function getNotesForApplication(jobApplicationId: string) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check notes feature access
  if (!has({ feature: 'notes' })) {
    return []; // Return empty array instead of throwing error for read operations
  }

  // Verify the job application belongs to the user
  const application = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.id, jobApplicationId),
        eq(jobApplications.userId, userId)
      )
    )
    .limit(1);

  if (application.length === 0) {
    throw new Error("Job application not found or you don't have permission");
  }

  // Get all notes for this application, ordered by newest first
  const applicationNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.jobApplicationId, jobApplicationId))
    .orderBy(desc(notes.createdAt));

  return applicationNotes;
}

/**
 * Updates an existing note
 * Verifies ownership through the parent job application
 */
export async function updateNote(input: UpdateNoteInput) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check notes feature access
  if (!has({ feature: 'notes' })) {
    throw new Error("Upgrade to Pro to access notes feature");
  }

  // Validate input
  const validatedData = updateNoteSchema.parse(input);

  // Verify the note exists and belongs to user's application
  const noteWithApp = await db
    .select({
      note: notes,
      application: jobApplications,
    })
    .from(notes)
    .innerJoin(jobApplications, eq(notes.jobApplicationId, jobApplications.id))
    .where(
      and(
        eq(notes.id, validatedData.id),
        eq(jobApplications.userId, userId)
      )
    )
    .limit(1);

  if (noteWithApp.length === 0) {
    throw new Error("Note not found or you don't have permission");
  }

  // Update the note
  const result = await db
    .update(notes)
    .set({
      content: validatedData.content,
    })
    .where(eq(notes.id, validatedData.id))
    .returning();

  revalidatePath("/track");
  return result[0];
}

/**
 * Deletes a note
 * Verifies ownership through the parent job application
 */
export async function deleteNote(input: DeleteNoteInput) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check notes feature access
  if (!has({ feature: 'notes' })) {
    throw new Error("Upgrade to Pro to access notes feature");
  }

  // Validate input
  const validatedData = deleteNoteSchema.parse(input);

  // Verify the note exists and belongs to user's application
  const noteWithApp = await db
    .select({
      note: notes,
      application: jobApplications,
    })
    .from(notes)
    .innerJoin(jobApplications, eq(notes.jobApplicationId, jobApplications.id))
    .where(
      and(
        eq(notes.id, validatedData.id),
        eq(jobApplications.userId, userId)
      )
    )
    .limit(1);

  if (noteWithApp.length === 0) {
    throw new Error("Note not found or you don't have permission");
  }

  // Delete the note
  const result = await db
    .delete(notes)
    .where(eq(notes.id, validatedData.id))
    .returning();

  revalidatePath("/track");
  return result[0];
}

