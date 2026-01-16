import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function migrateStatusEnum() {
  console.log("Starting migration: changing 'accepted' to 'offer' in application_status enum...");
  
  try {
    // Run the migration SQL
    await db.execute(sql`ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DATA TYPE text`);
    console.log("✓ Converted column to text");
    
    await db.execute(sql`ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::text`);
    console.log("✓ Set temporary default");
    
    await db.execute(sql`DROP TYPE "public"."application_status"`);
    console.log("✓ Dropped old enum type");
    
    await db.execute(sql`CREATE TYPE "public"."application_status" AS ENUM('bookmarked', 'applied', 'interviewing', 'no_match', 'offer')`);
    console.log("✓ Created new enum type with 'offer'");
    
    await db.execute(sql`ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DEFAULT 'bookmarked'::"public"."application_status"`);
    console.log("✓ Set default with new enum type");
    
    await db.execute(sql`ALTER TABLE "job_applications" ALTER COLUMN "application_status" SET DATA TYPE "public"."application_status" USING "application_status"::"public"."application_status"`);
    console.log("✓ Converted column back to enum type");
    
    console.log("\n✅ Migration completed successfully!");
    console.log("The status 'accepted' has been changed to 'offer'");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateStatusEnum();
