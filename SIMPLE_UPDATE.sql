-- Simple database update (no data conversion needed since old entries are deleted)

-- Step 1: Convert column to text temporarily
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DATA TYPE text;

-- Step 2: Set default as text
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::text;

-- Step 3: Drop old enum type
DROP TYPE IF EXISTS "public"."application_status" CASCADE;

-- Step 4: Create new enum type with new values
CREATE TYPE "public"."application_status" AS ENUM(
  'bookmarked', 
  'applied', 
  'interviewing', 
  'no_match', 
  'accepted'
);

-- Step 5: Set default to new enum
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::"public"."application_status";

-- Step 6: Convert column back to enum
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" 
SET DATA TYPE "public"."application_status" 
USING "application_status"::"public"."application_status";

