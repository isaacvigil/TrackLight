# Database Schema Documentation

This document describes the database schema for the TrackLight job application tracking app.

## Overview

The database uses **PostgreSQL** (Neon) with **Drizzle ORM** and consists of two main tables:

1. **job_applications** - Stores all job application records
2. **notes** - Stores notes associated with job applications

## Tables

### job_applications

Stores information about each job application a user tracks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique identifier (CUID2) |
| `user_id` | `text` | NOT NULL | Clerk user ID |
| `company` | `varchar(255)` | NOT NULL | Company name |
| `role` | `varchar(255)` | NOT NULL | Job role/position title |
| `salary` | `varchar(100)` | NULLABLE | Salary information (flexible format) |
| `location` | `varchar(255)` | NULLABLE | Job location |
| `application_status` | `application_status` | NOT NULL, DEFAULT 'wishlist' | Current application status |
| `applied_date` | `timestamp` | NULLABLE | Date when application was submitted |
| `status_change_date` | `timestamp` | NULLABLE | Date when status last changed |
| `job_url` | `text` | NULLABLE | URL to job posting |
| `created_at` | `timestamp` | NOT NULL, DEFAULT now() | Record creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT now() | Record last update timestamp |

#### Application Status Enum

The `application_status` field is an enum with the following possible values:

- `wishlist` - Job saved for future application (default)
- `applied` - Application submitted
- `interview` - Interview scheduled or completed
- `offer` - Job offer received
- `rejected` - Application rejected
- `accepted` - Offer accepted
- `withdrawn` - Application withdrawn by user

### notes

Stores notes associated with each job application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique identifier (CUID2) |
| `job_application_id` | `text` | NOT NULL, FOREIGN KEY | References `job_applications.id` |
| `content` | `text` | NOT NULL | Note content |
| `created_at` | `timestamp` | NOT NULL, DEFAULT now() | Note creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT now() | Note last update timestamp |

**Foreign Key Constraint:**
- `job_application_id` references `job_applications(id)` with `ON DELETE CASCADE`
- When a job application is deleted, all associated notes are automatically deleted

## Relationships

```
job_applications (1) ──── (many) notes
```

One job application can have multiple notes.

## TypeScript Types

The schema exports TypeScript types for type-safe database operations:

### job-applications.ts
```typescript
import { JobApplication, NewJobApplication } from "@/db/schema";

// JobApplication - Complete record including id and timestamps
// NewJobApplication - For inserting new records (id and timestamps are auto-generated)
```

### notes.ts
```typescript
import { Note, NewNote } from "@/db/schema";

// Note - Complete record including id and timestamps
// NewNote - For inserting new records (id and timestamps are auto-generated)
```

## Usage Examples

### Querying Job Applications

```typescript
import { db } from "@/lib/db";
import { jobApplications } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all applications for a user
const userApplications = await db
  .select()
  .from(jobApplications)
  .where(eq(jobApplications.userId, clerkUserId));

// Get a specific application
const application = await db
  .select()
  .from(jobApplications)
  .where(eq(jobApplications.id, applicationId))
  .limit(1);
```

### Creating a Job Application

```typescript
import { db } from "@/lib/db";
import { jobApplications, NewJobApplication } from "@/db/schema";

const newApplication: NewJobApplication = {
  userId: clerkUserId,
  company: "Acme Corp",
  role: "Senior Developer",
  salary: "$100k-$120k",
  location: "Remote",
  applicationStatus: "applied",
  appliedDate: new Date(),
  jobUrl: "https://example.com/jobs/123",
};

const [created] = await db
  .insert(jobApplications)
  .values(newApplication)
  .returning();
```

### Updating Application Status

```typescript
import { db } from "@/lib/db";
import { jobApplications } from "@/db/schema";
import { eq } from "drizzle-orm";

await db
  .update(jobApplications)
  .set({
    applicationStatus: "interview",
    statusChangeDate: new Date(),
  })
  .where(eq(jobApplications.id, applicationId));
```

### Adding a Note

```typescript
import { db } from "@/lib/db";
import { notes, NewNote } from "@/db/schema";

const newNote: NewNote = {
  jobApplicationId: applicationId,
  content: "Great interview with the hiring manager. Technical round next week.",
};

const [created] = await db
  .insert(notes)
  .values(newNote)
  .returning();
```

### Querying Application with Notes

```typescript
import { db } from "@/lib/db";
import { jobApplications, notes } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get application with all its notes
const applicationWithNotes = await db
  .select()
  .from(jobApplications)
  .leftJoin(notes, eq(notes.jobApplicationId, jobApplications.id))
  .where(eq(jobApplications.id, applicationId));
```

## Database Commands

```bash
# Generate migration files after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema changes directly (development only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Notes

- **User Authentication**: This schema assumes authentication is handled by Clerk. The `user_id` field stores the Clerk user ID as a string.
- **CUID2 IDs**: The schema uses CUID2 for generating unique, collision-resistant IDs.
- **Timestamps**: Both tables include `created_at` and `updated_at` fields that are automatically managed.
- **Cascade Deletion**: Deleting a job application will automatically delete all associated notes.
- **Flexible Salary Format**: The salary field is stored as varchar to accommodate various formats (ranges, different currencies, etc.).
- **Status Tracking**: Both `applied_date` and `status_change_date` help track the application timeline.
