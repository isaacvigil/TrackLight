# Production Deployment Checklist

This document outlines everything you need to update and verify when deploying TrackLight to production.

## ✅ Completed

- [x] **Clerk Middleware Configured** - `proxy.ts` enhanced with authentication routing protection

## 🔑 Environment Variables to Update

### 1. Clerk Authentication (REQUIRED)

Replace test keys with production keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # Change from pk_test_...
CLERK_SECRET_KEY=sk_live_...                    # Change from sk_test_...
```

**Where to get production keys:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Switch to your **Production** instance (or create one)
3. Navigate to **API Keys** section
4. Copy the `pk_live_...` and `sk_live_...` keys

### 2. Database (REQUIRED)

Use your production Neon database URL:

```bash
DATABASE_URL=postgresql://...  # Production database connection string
```

**Important:** 
- Use a separate production database (not your dev database)
- Ensure migrations have been run on production database
- Run `npm run db:migrate` in production environment

### 3. OpenAI API (REQUIRED)

```bash
OPENAI_API_KEY=sk-proj-...  # Same key works for dev and production
```

**Note:** OpenAI doesn't have separate dev/prod keys. Monitor usage in [OpenAI Dashboard](https://platform.openai.com/usage).

### 4. PostHog Analytics (OPTIONAL)

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...  # Production project key (recommended)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or https://eu.i.posthog.com
```

**Recommended:** Create a separate PostHog project for production to keep analytics separate from development.

## 🏷️ Clerk Billing Configuration

### In Clerk Dashboard → Billing:

1. **Enable Billing** for your production instance
2. **Set up payment provider** (Stripe integration)
3. **Create Subscription Plans** with these exact names:
   - `free_user` (default/free plan)
   - `pro` (paid plan)
   - `unemployed` (special pricing for job seekers)
4. **Create Features** with these exact names:
   - `unlimited_rows` (assign to `pro` and `unemployed` plans)
   - `notes` (assign to `pro` and `unemployed` plans)
5. **Set pricing** for each paid plan
6. **Set `free_user` as default plan** for new signups
7. **Test the checkout flow** before going live

### Plan-Feature Matrix:

| Feature | free_user | pro | unemployed |
|---|---|---|---|
| Track applications | ✅ (up to 20) | ✅ (unlimited*) | ✅ (unlimited*) |
| Delete applications | ✅ | ✅ | ✅ |
| Add notes | ❌ | ✅ | ✅ |

*Unlimited = 10,000 effective limit

### ⚠️ Critical: Plan/Feature Names Must Match Exactly

Your code uses:
- `has({ plan: 'free_user' })` 
- `has({ plan: 'pro' })`
- `has({ plan: 'unemployed' })`
- `has({ feature: 'unlimited_rows' })`
- `has({ feature: 'notes' })`

Dashboard configuration MUST use these exact names (case-sensitive).

## 🚀 Deployment Platform Setup (Vercel)

### Environment Variables in Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all variables listed above for **Production** environment
4. Optionally add for **Preview** environment (recommended for testing)

### Build Settings:

```bash
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Domain Setup:

1. Add your custom domain in Vercel
2. Update Clerk allowed origins:
   - Go to Clerk Dashboard → **Domains**
   - Add your production domain (e.g., `tracklight.app`)
   - Add callback URLs:
     - `https://yourdomain.com`
     - `https://yourdomain.com/track`

## 📊 Database Migration

Before deploying:

```bash
# Generate migration files (if you have schema changes)
npm run db:generate

# Apply migrations to production database
# (set DATABASE_URL to production in .env.local temporarily, or use Vercel CLI)
npm run db:migrate
```

**Alternative:** Use Drizzle Studio to verify your production database schema:
```bash
npm run db:studio
```

## 🧪 Pre-Launch Testing

Test these flows before going live:

### Authentication:
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] User data is isolated (can't see other users' data)

### Billing:
- [ ] Free plan limits enforced (20 applications max)
- [ ] Upgrade to Pro flow works
- [ ] Pro features unlock immediately after upgrade
- [ ] Notes feature restricted to Pro users only
- [ ] Free users see upgrade prompts

### Core Features:
- [ ] Add job application via URL (AI extraction)
- [ ] Edit all fields inline
- [ ] Delete application
- [ ] Add notes (Pro users only)
- [ ] Table sorting works
- [ ] Data persists after refresh

### Edge Cases:
- [ ] LinkedIn job URLs (may show placeholders - expected)
- [ ] Invalid URLs show error
- [ ] Duplicate URL detection works
- [ ] Reaching row limit shows error with upgrade CTA

## 🔒 Security Checklist

- [ ] `.env.local` is NOT committed to git (verify with `git status`)
- [ ] All production environment variables are set in deployment platform
- [ ] `CLERK_SECRET_KEY` is kept secret (never exposed to client)
- [ ] `OPENAI_API_KEY` is kept secret (never exposed to client)
- [ ] Database URL uses SSL (`?sslmode=require`)
- [ ] Clerk middleware is active (`proxy.ts` configured with route protection)
- [ ] CORS/allowed origins configured in Clerk Dashboard

## 📈 Post-Deployment Monitoring

### Week 1:
- [ ] Monitor OpenAI API usage and costs
- [ ] Check error logs for authentication issues
- [ ] Verify database connections are stable
- [ ] Monitor Clerk billing events
- [ ] Check PostHog analytics for user behavior

### Ongoing:
- [ ] Set up billing alerts in Stripe (if using paid plans)
- [ ] Monitor OpenAI costs (set up usage alerts)
- [ ] Review Clerk billing dashboard for subscription metrics
- [ ] Check Vercel logs for errors

## 🆘 Rollback Plan

If something goes wrong:

1. **Revert deployment** in Vercel (use previous deployment)
2. **Check environment variables** - most issues are config-related
3. **Verify Clerk billing config** - plan/feature names must match code
4. **Check database connection** - ensure production DB is accessible
5. **Review logs** in Vercel dashboard for error details

## 📞 Support Resources

- **Clerk Support**: https://clerk.com/support
- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/docs/introduction
- **OpenAI Support**: https://help.openai.com

## 🎯 Success Criteria

Your production deployment is successful when:

- ✅ Users can sign up and sign in
- ✅ Users can add job applications via URL
- ✅ AI extraction works (or shows placeholders gracefully)
- ✅ Free users are limited to 20 applications
- ✅ Pro users have unlimited applications and notes
- ✅ Billing upgrade flow works end-to-end
- ✅ No authentication errors in logs
- ✅ Data persists and is properly isolated per user

---

## 🚨 Common Issues & Fixes

### "Unauthorized" errors:
- **Cause**: Clerk keys not set or invalid
- **Fix**: Verify `CLERK_SECRET_KEY` in production environment variables

### AI extraction returns "(Unable to extract, input manually)":
- **Cause**: OpenAI API key missing or LinkedIn auth-required page
- **Fix**: Verify `OPENAI_API_KEY` set; LinkedIn pages need manual entry

### "You've reached your limit" but user is Pro:
- **Cause**: Feature not assigned to plan in Clerk Dashboard
- **Fix**: Go to Clerk Dashboard → Billing → assign `unlimited_rows` to `pro` plan

### PricingTable not showing:
- **Cause**: Billing not enabled in Clerk production instance
- **Fix**: Enable billing in Clerk Dashboard for production instance

### Middleware redirect loops:
- **Cause**: Public routes not configured properly
- **Fix**: Verify `proxy.ts` has correct public route configuration

---

**Last Updated:** 2026-01-11
**Version:** 1.0.0
