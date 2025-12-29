This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# TrackLight

A modern job application tracker with AI-powered data extraction.

## Features

- 🤖 **AI-Powered Data Extraction**: Paste a job posting URL and automatically extract company, role, salary, location, and remote status using OpenAI
- 🔐 **Secure Authentication**: User authentication via Clerk with subscription tiers
- 📊 **Application Tracking**: Track your job applications with statuses (bookmarked, applied, interviewing, etc.)
- 📝 **Notes Support**: Add notes to your applications (Pro feature)
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS v4
- 🌙 **Dark Mode**: Automatic theme switching based on system preferences

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **AI**: Vercel AI SDK with OpenAI GPT-4o

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** 20+ installed
2. **npm** or other package manager
3. **Neon Database** account (free tier available)
4. **Clerk** account for authentication (free tier available)
5. **OpenAI API Key** for AI data extraction ([Get one here](https://platform.openai.com/api-keys))

## Environment Setup

1. Create a `.env.local` file in the project root
2. Add the required environment variables (see [ENV_SETUP.md](ENV_SETUP.md) for details):

```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-proj-...
```

📖 **Full setup guide**: See [ENV_SETUP.md](ENV_SETUP.md) for detailed instructions.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Inter](https://fonts.google.com/specimen/Inter) from Google Fonts.

## Database Setup

This project uses Drizzle ORM with Neon PostgreSQL.

### Generate and apply migrations:

```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations to database
```

### Development tools:

```bash
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:push      # Push schema changes directly (for rapid development)
```

## AI Data Extraction

TrackLight uses OpenAI's GPT-4o model to automatically extract job information from URLs:

- **What it extracts**: Company name, job title/role, salary, location, remote status
- **How it works**: Fetches page content → sends to OpenAI → populates database
- **Limitations**: 
  - JavaScript-rendered sites (SPAs) may fail to extract
  - Authentication-required pages (LinkedIn) return placeholders
  - Users can manually edit any field by clicking on it
- **Cost**: ~$0.02-0.03 per extraction

See `.cursor/rules/ai-data-extraction.mdc` for full implementation details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
