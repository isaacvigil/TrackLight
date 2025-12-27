-- First, let's check what enum values currently exist
-- Run this to see what's in your database:
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'application_status'::regtype 
ORDER BY enumsortorder;

-- If the above shows old values (wishlist, interview, etc.), run this fix:

-- STEP 1: Convert to text (this will work even if enum has constraints)
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" DROP DEFAULT;

ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" TYPE text;

-- STEP 2: Drop the old enum
DROP TYPE IF EXISTS "public"."application_status" CASCADE;

-- STEP 3: Create new enum with new values
CREATE TYPE "public"."application_status" AS ENUM(
  'bookmarked', 
  'applied', 
  'interviewing', 
  'no_match', 
  'accepted'
);

-- STEP 4: Convert column back to enum (will fail if there's data with old values)
-- Since you deleted old entries, this should work
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" TYPE "public"."application_status" 
USING "application_status"::"public"."application_status";

-- STEP 5: Set the default
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::"public"."application_status";

-- STEP 6: Verify the fix - should show new values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'application_status'::regtype 
ORDER BY enumsortorder;

