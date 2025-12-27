import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

async function checkEnum() {
  console.log("Checking enum values in database...\n");
  
  try {
    const result = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'application_status'::regtype 
      ORDER BY enumsortorder
    `;
    
    console.log("Current enum values:");
    result.forEach((row: any) => {
      console.log(`  - ${row.enumlabel}`);
    });
    
    console.log("\nExpected values:");
    console.log("  - bookmarked");
    console.log("  - applied");
    console.log("  - interviewing");
    console.log("  - no_match");
    console.log("  - accepted");
    
    const values = result.map((r: any) => r.enumlabel);
    if (values.includes('bookmarked') && values.includes('interviewing') && values.includes('no_match')) {
      console.log("\n✅ Database enum is correct!");
    } else {
      console.log("\n❌ Database enum needs to be updated!");
      console.log("\nRun the SQL migration in Neon Console:");
      console.log("See CHECK_AND_FIX.sql for the migration script");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkEnum();

