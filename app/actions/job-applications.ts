"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { jobApplications } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { eq, and, count } from "drizzle-orm";

// ✅ CORRECT: Define Zod schema for validation
const createJobApplicationSchema = z.object({
  jobUrl: z.string().url("Please enter a valid URL"),
});

// Zod schema for AI-extracted data
// Note: OpenAI's structured output requires all fields to be required
// We use empty strings for unavailable data instead of optional fields
const jobDataSchema = z.object({
  company: z.string().describe("The company name"),
  role: z.string().describe("The job title or role"),
  salary: z.string().describe("Salary information if available, or empty string if not found"),
  location: z.string().describe("The physical city/location name only, or empty string if not found"),
  remoteStatus: z.string().describe("Remote work arrangement: 'Remote', 'Hybrid', 'In-office', or empty string if not specified"),
});

// ✅ CORRECT: Infer TypeScript type from Zod schema
type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;
type ExtractedJobData = z.infer<typeof jobDataSchema>;

/**
 * Normalizes LinkedIn job URLs to use the cleaner /view/ format
 * Converts: https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4345745336
 * To: https://www.linkedin.com/jobs/view/4345745336
 */
function normalizeLinkedInUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Check if this is a LinkedIn URL
    if (!urlObj.hostname.includes('linkedin.com')) {
      return url;
    }
    
    // Check if it's a collections URL with currentJobId parameter
    if (urlObj.pathname.includes('/jobs/collections/') && urlObj.searchParams.has('currentJobId')) {
      const jobId = urlObj.searchParams.get('currentJobId');
      if (jobId) {
        return `https://www.linkedin.com/jobs/view/${jobId}`;
      }
    }
    
    // Return original URL if it doesn't match the pattern
    return url;
  } catch (error) {
    // If URL parsing fails, return original
    console.error("Failed to normalize LinkedIn URL:", error);
    return url;
  }
}

/**
 * Fetches webpage content from a URL
 */
async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract text content from HTML (simple approach - remove script/style tags)
    const cleanedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Log content length for debugging
    console.log(`Fetched content length: ${cleanedHtml.length} chars for URL: ${url}`);
    
    // Even if content is short, return it - let AI decide if it's useful
    // Limit to first 12000 characters to provide more context
    return cleanedHtml.substring(0, 12000);
  } catch (error) {
    console.error("Failed to fetch page content:", error);
    return "";
  }
}

/**
 * Extracts job application data from a URL using OpenAI
 */
async function extractJobDataFromUrl(url: string): Promise<ExtractedJobData> {
  try {
    // First, fetch the actual page content
    const pageContent = await fetchPageContent(url);
    
    if (!pageContent) {
      console.warn("Could not fetch page content, using fallback");
      return {
        company: "[Update required]",
        role: "[Update required]",
        salary: "",
        location: "",
        remoteStatus: "",
      };
    }
    
    console.log(`Extracting job data from ${pageContent.length} chars of content...`);
    
    const { output } = await generateText({
      model: openai("gpt-4o"), // Use gpt-4o for better accuracy
      output: Output.object({
        schema: z.object({
          jobData: jobDataSchema,
        }),
      }),
      prompt: `Extract job application information from this job posting page content.
      
      URL: ${url}
      
      PAGE CONTENT:
      ${pageContent}
      
      Extract the following information:
      
      1. Company name - The employer/company name
      
      2. Job title/role - The position title (e.g., "Senior Software Engineer", "Product Manager")
         - DO NOT use generic site navigation text like "Join Our Team" or "Careers"
      
      3. Salary - Preserve exact format if found (e.g., "$80k-$100k", "€70,000")
         - Return empty string if not found
      
      4. Location - The job location(s):
         - If 1 location: return the city name (e.g., "San Francisco", "Barcelona")
         - If 2-3 locations: return comma-separated (e.g., "London, Paris, Berlin")
         - If more than 3 locations: return "Multiple"
         - Extract only city/place names, not country codes
         - Examples: "ESP | Barcelona" → "Barcelona", "UK, Spain, Germany" → "UK, Spain, Germany"
         - Do NOT include work arrangement (Remote/Hybrid) in this field
         - Return empty string if not found
      
      5. Remote Status - Work arrangement only:
         - Look for: "Remote", "Hybrid", "In-office", "On-site"
         - Return empty string if not specified
      
      Rules:
      - Use EXACT text from the page content
      - Keep location and remote status separate
      - Don't make up or guess information
      - Return empty string for missing optional fields`,
    });
    
    console.log(`Extracted data:`, output.jobData);

    return output.jobData;
  } catch (error) {
    console.error("AI extraction failed:", error);
    // Fallback to placeholder data if AI fails
    return {
      company: "[Update required]",
      role: "[Update required]",
      salary: "",
      location: "",
      remoteStatus: "",
    };
  }
}

export async function createJobApplication(input: CreateJobApplicationInput) {
  // ✅ CORRECT: Authenticate user first
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // ✅ CORRECT: Validate with Zod
  const validatedData = createJobApplicationSchema.parse(input);

  // Check row limit before processing
  const [{ count: rowCount }] = await db
    .select({ count: count() })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId));

  const has1kRows = has({ feature: '1k_rows' });
  const maxRows = has1kRows ? 1000 : 20;

  if (rowCount >= maxRows) {
    throw new Error(
      `You've reached your limit of ${maxRows} applications. ${
        !has1kRows ? 'Upgrade to Pro to track up to 1,000 applications.' : ''
      }`
    );
  }

  // Normalize LinkedIn URLs to cleaner format
  const normalizedUrl = normalizeLinkedInUrl(validatedData.jobUrl);

  // Extract job data using AI
  const extractedData = await extractJobDataFromUrl(normalizedUrl);

  // ✅ CORRECT: Insert with userId from authenticated user and AI-extracted data
  // Convert empty strings to null for optional database fields
  // Default status is "applied" because users paste job links after applying
  const result = await db
    .insert(jobApplications)
    .values({
      userId,
      jobUrl: normalizedUrl, // Use normalized URL
      company: extractedData.company,
      role: extractedData.role,
      salary: extractedData.salary.trim() || null,
      location: extractedData.location.trim() || null,
      remoteStatus: extractedData.remoteStatus.trim() || null,
      applicationStatus: "applied",
      appliedDate: new Date(), // Set to current date when adding job
      statusChangeDate: null, // Only set when user explicitly changes status
    })
    .returning();

  revalidatePath("/track");
  return result[0];
}

/**
 * Updates a job application field
 * Only allows updates if the application belongs to the authenticated user
 */
export async function updateJobApplicationField(
  applicationId: string,
  field: string,
  value: string | null
) {
  // ✅ CORRECT: Authenticate user first
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Define allowed fields for updates
  const allowedFields = [
    "company",
    "role",
    "salary",
    "location",
    "remoteStatus",
    "applicationStatus",
  ];

  if (!allowedFields.includes(field)) {
    throw new Error("Invalid field");
  }

  // If updating status, we need to check the current status first
  let currentApplication = null;
  if (field === "applicationStatus") {
    const apps = await db
      .select()
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.id, applicationId),
          eq(jobApplications.userId, userId)
        )
      )
      .limit(1);
    
    if (apps.length === 0) {
      throw new Error("Application not found or you don't have permission to update it");
    }
    
    currentApplication = apps[0];
  }

  // Build the update object dynamically
  const updateData: Record<string, string | null | Date> = {
    [field]: value,
  };

  // If updating status, also update statusChangeDate and handle appliedDate
  if (field === "applicationStatus" && currentApplication) {
    updateData.statusChangeDate = new Date();
    
    // If changing TO bookmarked, clear the appliedDate (not yet applied)
    if (value === "bookmarked") {
      updateData.appliedDate = null;
    }
    // If changing FROM bookmarked to any other status, set appliedDate to now
    else if (currentApplication.applicationStatus === "bookmarked" && !currentApplication.appliedDate) {
      updateData.appliedDate = new Date();
    }
  }

  // ✅ CORRECT: Update only if the record belongs to the user
  const result = await db
    .update(jobApplications)
    .set(updateData)
    .where(
      and(
        eq(jobApplications.id, applicationId),
        eq(jobApplications.userId, userId) // CRITICAL: Check ownership
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error("Application not found or you don't have permission to update it");
  }

  if (result.length > 1) {
    console.error("WARNING: Multiple rows updated!", { applicationId, userId, field, rowsAffected: result.length });
    throw new Error("Unexpected error: Multiple rows were updated");
  }

  revalidatePath("/track");
  return result[0];
}

/**
 * Deletes a job application
 * Only allows deletion if the application belongs to the authenticated user
 */
export async function deleteJobApplication(applicationId: string) {
  // ✅ CORRECT: Authenticate user first
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // ✅ CORRECT: Delete only if the record belongs to the user
  const result = await db
    .delete(jobApplications)
    .where(
      and(
        eq(jobApplications.id, applicationId),
        eq(jobApplications.userId, userId) // CRITICAL: Check ownership
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error("Application not found or you don't have permission to delete it");
  }

  revalidatePath("/track");
  return result[0];
}

/**
 * Updates the notes field for a job application
 * Only allows updates if the application belongs to the authenticated user
 */
export async function updateJobApplicationNotes(input: { id: string; notes: string | null }) {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check notes feature access
  if (!has({ feature: 'notes' })) {
    throw new Error("Upgrade to Pro to access notes feature");
  }

  // Validate input
  const updateNotesSchema = z.object({
    id: z.string().min(1, "Application ID is required"),
    notes: z.string().max(50000, "Notes are too long").nullable(),
  });

  const validatedData = updateNotesSchema.parse(input);

  // Update only if the record belongs to the user
  const result = await db
    .update(jobApplications)
    .set({ notes: validatedData.notes })
    .where(
      and(
        eq(jobApplications.id, validatedData.id),
        eq(jobApplications.userId, userId)
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error("Application not found or you don't have permission to update it");
  }

  revalidatePath("/track");
  return result[0];
}

