ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::text;--> statement-breakpoint
DROP TYPE "public"."application_status";--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('bookmarked', 'applied', 'interviewing', 'no_match', 'accepted');--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DATA TYPE "public"."application_status" USING "application_status"::"public"."application_status";