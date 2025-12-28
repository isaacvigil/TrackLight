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
        'User-Agent': 'Mozilla/5.0 (compatible; JobTrackerBot/1.0)',
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
    
    // Limit to first 8000 characters to avoid token limits
    return cleanedHtml.substring(0, 8000);
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
        company: "Company name (update required)",
        role: "Role (update required)",
        salary: "",
        location: "",
        remoteStatus: "",
      };
    }
    
    const { output } = await generateText({
      model: openai("gpt-4o"), // Use gpt-4o for better accuracy
      output: Output.object({
        schema: z.object({
          jobData: jobDataSchema,
        }),
      }),
      prompt: `Extract job application information from this job posting page.
      
      URL: ${url}
      
      PAGE CONTENT:
      ${pageContent}
      
      Analyze the job posting carefully and extract:
      
      1. Company name (required) - Look for the employer/company name
      
      2. Job title/role (required) - The position being advertised
      
      3. Salary information (if available):
         - Preserve original format like "$80k-$100k", "€70,000/year", "£50-60k"
         - If not found, return empty string
      
      4. Location (CRITICAL - Extract the EXACT city name from the page):
         - Extract ONLY the exact city/place name as written on the page
         - DO NOT make up or guess city names - use the exact text from the page
         - Look for location information in these places:
           * Page header/title (e.g., "Digital · ESP | Sant Cugat del Vallès · Hybrid")
           * "Locations:" or "Location:" labels
           * Near company name or job title
         - Common formats:
           * "COUNTRY_CODE | City Name" → extract ONLY "City Name" (e.g., "ESP | Sant Cugat del Vallès" → "Sant Cugat del Vallès")
           * "City, State/Country" → keep as-is (e.g., "San Francisco, CA")
           * Just city name → keep as-is (e.g., "Barcelona")
         - DO NOT include "Remote", "Hybrid", "In-office" in this field
         - DO NOT confuse with company headquarters if job location is different
         - If location is not found, return empty string
      
      5. Remote Status (IMPORTANT - separate from location):
         - Extract the work arrangement: "Remote", "Hybrid", "In-office"
         - Look for these indicators:
           * "Remote status: Hybrid" or "Remote status: Remote"
           * In breadcrumb format like "City · Hybrid" or "Location · Remote"
           * Labels like "Remote", "Hybrid", "On-site", "In-office", "Office-based"
           * Near location information but separate from it
         - Common values: "Remote", "Hybrid", "In-office", "On-site"
         - If not specified anywhere, return empty string
      
      IMPORTANT: 
      - The page content above contains the actual text from the job posting
      - Keep location and remote status completely separate
      - Extract the EXACT text as it appears in the content - do not paraphrase or guess
      - Look for location in breadcrumbs, headers, and job details sections
      - For formats like "ESP | Sant Cugat del Vallès", extract only "Sant Cugat del Vallès"
      - Common mistake: confusing company HQ with job location - use the job location only
      
      For fields that cannot be determined from the content, return an empty string.`,
    });

    return output.jobData;
  } catch (error) {
    console.error("AI extraction failed:", error);
    // Fallback to placeholder data if AI fails
    return {
      company: "Company name (update required)",
      role: "Role (update required)",
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
  const maxRows = has1kRows ? 1000 : 25;

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

