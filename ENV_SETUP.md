# Environment Variables Setup

This document describes the required environment variables for TrackLight.

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Database (Neon PostgreSQL)

```bash
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

Get your database URL from [Neon Dashboard](https://console.neon.tech/).

### Clerk Authentication

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Get your Clerk keys from [Clerk Dashboard](https://dashboard.clerk.com/).

### OpenAI API (Required for AI-powered job data extraction)

```bash
OPENAI_API_KEY=sk-proj-...
```

**Purpose**: Automatically extracts job information (company, role, salary, location, remote status) from job posting URLs.

**How to get it**: 
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and paste into `.env.local`

**Cost**: 
- Uses `gpt-4o` model for accuracy
- ~$0.02-0.03 per job extraction (including page content fetch)
- More expensive than `gpt-4o-mini`, but necessary to avoid hallucinated data

**What happens without it**: 
- Job creation will fail
- Users cannot add jobs via URL paste

### PostHog Analytics (Optional)

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Purpose**: Tracks user behavior and analytics for product insights.

**How to get it**: 
1. Sign up at [PostHog](https://posthog.com)
2. Create a new project
3. Copy the Project API Key and Host URL
4. Add to `.env.local`

**What happens without it**: 
- Analytics tracking will be disabled
- App continues to function normally
- A warning will appear in server logs: "PostHog API key not found. Analytics will be disabled."

## Example `.env.local` File

```bash
# Database
DATABASE_URL=postgresql://myuser:mypassword@ep-cool-forest-123456.us-east-2.aws.neon.tech/tracklight?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k
CLERK_SECRET_KEY=sk_test_abcdef1234567890

# OpenAI
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyz

# PostHog (Optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Security Notes

- ⚠️ **NEVER commit `.env.local` to version control**
- ✅ `.env.local` is already in `.gitignore`
- ✅ Use environment variables in production deployments (Vercel, etc.)
- ⚠️ Keep `OPENAI_API_KEY` secret - it's billed to your OpenAI account
- ⚠️ Keep `CLERK_SECRET_KEY` secret - it provides backend access to user data

## Troubleshooting

### "Unauthorized" error when adding jobs
- Check that `CLERK_SECRET_KEY` is set correctly
- Verify you're signed in to the app

### Job extraction returns placeholder values
- Check that `OPENAI_API_KEY` is set
- Verify the API key is valid in [OpenAI Dashboard](https://platform.openai.com/api-keys)
- Check the terminal/console for error messages
- Some job boards (LinkedIn, Greenhouse) may require authentication and won't extract properly

### Database connection errors
- Check that `DATABASE_URL` is correct
- Verify your Neon database is active (not hibernated)
- Test connection with `npm run db:studio`





