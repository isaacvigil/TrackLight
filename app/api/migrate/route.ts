import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Drop the notes table (CASCADE will remove foreign key constraints)
    await db.execute(sql`DROP TABLE IF EXISTS notes CASCADE`);
    
    // Add the notes column to job_applications if it doesn't exist
    await db.execute(sql`
      ALTER TABLE job_applications 
      ADD COLUMN IF NOT EXISTS notes text
    `);
    
    return NextResponse.json({ 
      success: true, 
      message: "✅ Successfully migrated notes to single field!" 
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

