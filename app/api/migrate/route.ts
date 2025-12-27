import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Add the remote_status column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE job_applications 
      ADD COLUMN IF NOT EXISTS remote_status varchar(50)
    `);
    
    return NextResponse.json({ 
      success: true, 
      message: "✅ Successfully added remote_status column!" 
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

