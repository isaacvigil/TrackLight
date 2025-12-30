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
 * Detects if page content is a login/sign-in page
 */
function isLoginPage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Strong indicators that this is definitely a login page
  const strongIndicators = [
    'sign in to view',
    'log in to view',
    'authentication required',
    'please sign in',
    'you must be logged in',
    'session expired',
  ];
  
  // If any strong indicator is present, it's a login page
  if (strongIndicators.some(indicator => lowerContent.includes(indicator))) {
    return true;
  }
  
  // Check for multiple login indicators
  const loginIndicators = [
    'sign in',
    'log in',
    'login',
    'forgot password',
    'create account',
    'register',
    'email or phone',
    'password',
    'keep me logged in',
  ];
  
  const matchCount = loginIndicators.filter(indicator => lowerContent.includes(indicator)).length;
  
  // If content is short (< 3000 chars) and has 3+ login indicators, it's a login page
  // OR if content is very short (< 1500 chars) and has 2+ indicators
  return (content.length < 3000 && matchCount >= 3) || (content.length < 1500 && matchCount >= 2);
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
    
    // Check if this is a login page
    if (isLoginPage(cleanedHtml)) {
      console.warn(`Detected login page for URL: ${url}`);
      return ""; // Return empty to trigger fallback
    }
    
    // Even if content is short, return it - let AI decide if it's useful
    // Limit to first 12000 characters to provide more context
    return cleanedHtml.substring(0, 12000);
  } catch (error) {
    console.error("Failed to fetch page content:", error);
    return "";
  }
}

/**
 * Attempts to extract company name from URL domain
 * Handles patterns like: company.jobs, careers.company.com, company.careers.com
 */
function extractCompanyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Remove common TLDs and get the main domain parts
    const domainParts = hostname.replace(/\.(com|net|org|io|co|jobs|uk|de|fr|es)$/g, '').split('.');
    
    // Pattern 1: company.jobs (e.g., dowjones.jobs)
    if (hostname.endsWith('.jobs')) {
      const companyName = domainParts[0];
      return formatCompanyName(companyName);
    }
    
    // Pattern 2: careers.company.com or jobs.company.com
    if (domainParts.length >= 2 && (domainParts[0] === 'careers' || domainParts[0] === 'jobs')) {
      const companyName = domainParts[1];
      return formatCompanyName(companyName);
    }
    
    // Pattern 3: company.careers.com
    if (domainParts.length >= 2 && (domainParts[1] === 'careers' || domainParts[1] === 'jobs')) {
      const companyName = domainParts[0];
      return formatCompanyName(companyName);
    }
    
    return null;
  } catch (error) {
    console.error("Failed to extract company from URL:", error);
    return null;
  }
}

/**
 * Formats a company name from URL slug to proper capitalization
 * Examples: "dowjones" → "Dow Jones", "microsoft" → "Microsoft"
 */
function formatCompanyName(slug: string): string {
  // Handle common multi-word companies
  const knownCompanies: Record<string, string> = {
    'dowjones': 'Dow Jones',
    'jpmorgan': 'JPMorgan',
    'goldmansachs': 'Goldman Sachs',
    'bankofamerica': 'Bank of America',
    'morganstanley': 'Morgan Stanley',
    'linkedin': 'LinkedIn',
  };
  
  if (knownCompanies[slug]) {
    return knownCompanies[slug];
  }
  
  // Default: capitalize first letter
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Extracts job application data from a URL using OpenAI
 */
async function extractJobDataFromUrl(url: string): Promise<ExtractedJobData> {
  try {
    // First, fetch the actual page content
    const pageContent = await fetchPageContent(url);
    
    // Try to extract company from URL as fallback
    const companyFromUrl = extractCompanyFromUrl(url);
    
    if (!pageContent) {
      console.warn("Could not fetch page content (likely login/auth required or JS-rendered), using URL-based fallback");
      return {
        company: companyFromUrl || "(Unable to extract, input manually)",
        role: "(Unable to extract, input manually)",
        salary: "",
        location: "",
        remoteStatus: "",
      };
    }
    
    console.log(`Extracting job data from ${pageContent.length} chars of content...`);
    
    // Check if this is a LinkedIn URL (might have authentication wall/partial content)
    const isLinkedInUrl = url.toLowerCase().includes('linkedin.com');
    
    const { output } = await generateText({
      model: openai("gpt-4o"), // Use gpt-4o for better accuracy
      output: Output.object({
        schema: z.object({
          jobData: jobDataSchema,
        }),
      }),
      prompt: `Extract job application information from this job posting page content.
      
      URL: ${url}
      ${companyFromUrl ? `\nHINT: The URL domain suggests this might be a "${companyFromUrl}" job posting.` : ''}
      ${isLinkedInUrl ? `\n⚠️  WARNING: This is a LinkedIn URL. The content may be incomplete due to authentication walls. Be EXTRA cautious with location data - only extract if ABSOLUTELY certain it's from the actual job posting, not navigation/footer/metadata text.` : ''}
      
      PAGE CONTENT:
      ${pageContent}
      
      Extract the following information:
      
      1. Company name - The employer/company name
         ${companyFromUrl ? `- If the page content doesn't clearly show the company, use: "${companyFromUrl}"` : ''}
      
      2. Job title/role - The position title (e.g., "Senior Software Engineer", "Product Manager")
         - DO NOT use generic site navigation text like "Join Our Team" or "Careers"
      
      3. Salary - Preserve exact format if found (e.g., "$80k-$100k", "€70,000")
         - Return empty string if not found
      
      4. Location - The job location(s):
         - ✅  EXTRACT FROM: Job posting metadata (e.g., "Location: United States"), job description, requirements section
         - ❌  DO NOT EXTRACT FROM: Site navigation menus, page headers, footer copyright text, user profile info
         - Look for patterns like:
           * "Location: [place]" (structured metadata) ✅
           * "Based in: [place]" (job description) ✅
           * "[Place] - Remote" (job description) ✅
           * Site footer "© 2024 Company, [Place]" (footer) ❌
           * Navigation "Jobs | [Place] | About" (navigation) ❌
         - If 1 location: return the city OR country name (e.g., "San Francisco", "Spain", "United States", "Barcelona")
         - If 2-3 locations: return separated by " / " (e.g., "London / Paris / Berlin")
         - If more than 3 locations: return "Multiple"
         - Extract only city/place/country names, not country codes
         - Examples: 
           * "Location: United States" → Location: "United States"
           * "ESP | Barcelona" → Location: "Barcelona"
           * "Spain (Remote)" → Location: "Spain", Remote Status: "Remote" (split them!)
           * "Barcelona - Remote" → Location: "Barcelona", Remote Status: "Remote" (split them!)
           * "UK / Spain / Germany" → Location: "UK / Spain / Germany"
         - Do NOT include work arrangement (Remote/Hybrid/In-office) in the location field
         - IMPORTANT: If you see location + remote status together (e.g., "Spain (Remote)"), 
           extract them as SEPARATE fields
         - If location is genuinely not stated in the job posting, return empty string
         - DO NOT guess or make up location information if it's not present
      
      5. Remote Status - Work arrangement only:
         - Look for: "Remote", "Hybrid", "In-office", "On-site"
         - If you see "Spain (Remote)" or "Barcelona - Remote":
           * Location = "Spain" or "Barcelona"
           * Remote Status = "Remote"
         - Return empty string if not specified
      
      CRITICAL RULES:
      - Use ONLY information that is EXPLICITLY present in the page content
      - For optional fields (salary, location, remoteStatus): If not clearly stated, return empty string
      - NEVER make up, guess, or infer information that isn't explicitly in the content
      - If the page content seems incomplete, minimal (< 1500 chars), or is a login page:
        * Return empty strings for ALL optional fields (salary, location, remoteStatus)
        * DO NOT extract ANY location information
      - If you see text like "sign in", "log in", "forgot password", treat as login page and return empty strings`,
    });
    
    console.log(`Extracted data:`, output.jobData);
    
    // If AI couldn't extract company but we have it from URL, use that
    if ((!output.jobData.company || output.jobData.company === "(Unable to extract, input manually)") && companyFromUrl) {
      output.jobData.company = companyFromUrl;
    }
    
    // Clean up location field: Extract and remove remote status if AI accidentally included it
    if (output.jobData.location) {
      const originalLocation = output.jobData.location;
      
      // Check for patterns like "Spain (Remote)", "Barcelona - Remote", etc.
      const remotePattern = /\s*[-–—()\s]*(remote|hybrid|in-office|on-site)\s*[-–—()\s]*/gi;
      const remoteMatch = originalLocation.match(/\b(remote|hybrid|in-office|on-site)\b/gi);
      
      // If we found a remote status in location and don't have one yet, extract it
      if (remoteMatch && !output.jobData.remoteStatus) {
        const extractedStatus = remoteMatch[0];
        // Capitalize first letter
        output.jobData.remoteStatus = extractedStatus.charAt(0).toUpperCase() + extractedStatus.slice(1).toLowerCase();
        console.log(`Extracted remote status "${output.jobData.remoteStatus}" from location field`);
      }
      
      // Now clean the location by removing the remote status
      const locationCleanup = originalLocation
        .replace(remotePattern, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (locationCleanup !== originalLocation) {
        console.log(`Cleaned location from "${originalLocation}" to "${locationCleanup}"`);
        output.jobData.location = locationCleanup;
      }
    }
    
    // Validate extraction: If page content was very short (< 800 chars), 
    // the data is likely unreliable/hallucinated
    // Reduced threshold because some structured job boards (like Dribbble) have concise, valid data
    if (pageContent.length < 800) {
      console.warn(`Page content very short (${pageContent.length} chars), validating extracted data`);
      
      // Only clear if data looks suspicious (generic/placeholder-like)
      // Allow location if it's a valid country/city name (not empty, has reasonable length)
      if (output.jobData.location && output.jobData.location.length < 2) {
        console.warn(`Clearing suspicious location (too short): "${output.jobData.location}"`);
        output.jobData.location = "";
      }
      
      if (output.jobData.salary && output.jobData.salary.length < 2) {
        console.warn(`Clearing suspicious salary (too short): "${output.jobData.salary}"`);
        output.jobData.salary = "";
      }
      
      // If company/role look generic or placeholder-like, flag them
      if (!output.jobData.company || output.jobData.company.length < 3) {
        output.jobData.company = "(Unable to extract, input manually)";
      }
      if (!output.jobData.role || output.jobData.role.length < 3) {
        output.jobData.role = "(Unable to extract, input manually)";
      }
    }

    return output.jobData;
  } catch (error) {
    console.error("AI extraction failed:", error);
    // Fallback: try to use company from URL
    const companyFromUrl = extractCompanyFromUrl(url);
    return {
      company: companyFromUrl || "(Unable to extract, input manually)",
      role: "(Unable to extract, input manually)",
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

  const hasUnlimitedRows = has({ feature: 'unlimited_rows' });
  const maxRows = hasUnlimitedRows ? 10000 : 20; // 10k effective limit for unlimited plans

  if (rowCount >= maxRows) {
    throw new Error(
      `You've reached your limit of ${maxRows} applications. ${
        !hasUnlimitedRows ? 'Upgrade to Pro for unlimited applications.' : ''
      }`
    );
  }

  // Normalize LinkedIn URLs to cleaner format
  const normalizedUrl = normalizeLinkedInUrl(validatedData.jobUrl);

  // Check if this URL already exists for the user
  const existingApplications = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.jobUrl, normalizedUrl)
      )
    );

  const isDuplicate = existingApplications.length > 0;

  // Extract job data using AI
  const extractedData = await extractJobDataFromUrl(normalizedUrl);

  // ✅ CORRECT: Insert with userId from authenticated user and AI-extracted data
  // Convert empty strings to null for optional database fields
  // Default status is "applied" because users paste job links after applying
  // Still insert even if it's a duplicate - user may have multiple applications to the same job
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
  
  // Return the result with duplicate flag
  return {
    ...result[0],
    isDuplicate,
  };
}

/**
 * Updates a job application field
 * Only allows updates if the application belongs to the authenticated user
 */
export async function updateJobApplicationField(
  applicationId: string,
  field: string,
  value: string | Date | null
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
    "appliedDate",
    "statusChangeDate",
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
    
    // Debug: Log status change date update
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating statusChangeDate:', {
        applicationId,
        oldStatus: currentApplication.applicationStatus,
        newStatus: value,
        statusChangeDate: updateData.statusChangeDate,
      });
    }
    
    // If changing TO bookmarked, clear the appliedDate (not yet applied)
    if (value === "bookmarked") {
      updateData.appliedDate = null;
    }
    // If changing FROM bookmarked to any other status, set appliedDate to now
    else if (currentApplication.applicationStatus === "bookmarked" && !currentApplication.appliedDate) {
      updateData.appliedDate = new Date();
    }
  }

  // If manually updating appliedDate or statusChangeDate, ensure proper type
  if (field === "appliedDate" || field === "statusChangeDate") {
    // Value is already a Date or null from the client
    updateData[field] = value as Date | null;
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

