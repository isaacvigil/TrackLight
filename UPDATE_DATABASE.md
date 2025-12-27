# Database Update Instructions

Your database needs to be updated to use the new status values. Follow these steps:

## Step 1: Open Neon Database Console

1. Go to https://console.neon.tech/
2. Select your project: **12-TrackLight**
3. Navigate to the **SQL Editor** tab

## Step 2: Run This SQL

Copy and paste this entire SQL script into the SQL Editor and click "Run":

```sql
-- Step 1: Update existing records to use new status values
UPDATE job_applications 
SET application_status = 'bookmarked' 
WHERE application_status = 'wishlist';

UPDATE job_applications 
SET application_status = 'interviewing' 
WHERE application_status = 'interview';

UPDATE job_applications 
SET application_status = 'no_match' 
WHERE application_status IN ('rejected', 'withdrawn');

UPDATE job_applications 
SET application_status = 'accepted' 
WHERE application_status IN ('offer', 'accepted');

-- Step 2: Convert column to text temporarily
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DATA TYPE text;

-- Step 3: Set default as text
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::text;

-- Step 4: Drop old enum type
DROP TYPE IF EXISTS "public"."application_status" CASCADE;

-- Step 5: Create new enum type with new values
CREATE TYPE "public"."application_status" AS ENUM(
  'bookmarked', 
  'applied', 
  'interviewing', 
  'no_match', 
  'accepted'
);

-- Step 6: Set default to new enum
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::"public"."application_status";

-- Step 7: Convert column back to enum
ALTER TABLE "job_applications" 
ALTER COLUMN "application_status" 
SET DATA TYPE "public"."application_status" 
USING "application_status"::"public"."application_status";
```

## Step 3: Verify

After running the SQL, refresh your TrackLight app. You should now be able to:
- ✅ Change status values
- ✅ See the new status options: Bookmarked, Applied, Interviewing, No match, Accepted!
- ✅ All existing applications will have their statuses converted to the new values

## New Status Values

| Old Status | New Status |
|-----------|-----------|
| Wishlist → | Bookmarked |
| Applied → | Applied (same) |
| Interview → | Interviewing |
| Offer → | Accepted! |
| Rejected → | No match |
| Withdrawn → | No match |
| Accepted → | Accepted! |

---

**Note:** This is a one-time update. Once completed, all future status changes will work correctly.

