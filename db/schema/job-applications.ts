import { pgTable, text, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Define application status enum
export const applicationStatusEnum = pgEnum("application_status", [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
  "accepted",
  "withdrawn",
]);

export const jobApplications = pgTable("job_applications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(), // Clerk user ID
  company: varchar("company", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  salary: varchar("salary", { length: 100 }), // Flexible format (e.g., "$80k-$100k", "€70,000")
  location: varchar("location", { length: 255 }),
  remoteStatus: varchar("remote_status", { length: 50 }), // e.g., "Remote", "Hybrid", "In-office"
  applicationStatus: applicationStatusEnum("application_status")
    .notNull()
    .default("wishlist"),
  appliedDate: timestamp("applied_date", { mode: "date" }),
  statusChangeDate: timestamp("status_change_date", { mode: "date" }),
  jobUrl: text("job_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;

