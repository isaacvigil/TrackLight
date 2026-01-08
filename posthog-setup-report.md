# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your TrackLight Next.js application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (Next.js 15.3+ recommended approach)
- **Server-side tracking** via `lib/posthog-server.ts` for server components
- **User identification** integrated with Clerk authentication via `PostHogIdentify` component
- **Reverse proxy** configured in `next.config.ts` for improved tracking reliability
- **Error tracking** enabled via `capture_exceptions: true`
- **12 custom events** tracking key user actions across the application

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `job_application_added` | User successfully adds a new job application by pasting a job URL | `components/add-application-form.tsx` |
| `job_application_add_failed` | User attempts to add a job application but encounters an error | `components/add-application-form.tsx` |
| `row_limit_reached` | User reaches their row limit when attempting to add an application | `components/add-application-form.tsx` |
| `application_search_performed` | User performs a search in their job applications | `components/add-application-form.tsx` |
| `job_application_deleted` | User deletes a job application from their tracker | `components/delete-application-button.tsx` |
| `application_status_changed` | User changes the status of a job application | `components/editable-status-cell.tsx` |
| `notes_saved` | User saves notes for a job application (Pro feature) | `components/notes-dialog.tsx` |
| `notes_upgrade_prompt_viewed` | Free user views the notes upgrade prompt dialog | `components/notes-dialog.tsx` |
| `pricing_page_viewed` | User views the pricing page (server-side tracked) | `app/pricing/page.tsx` |
| `pricing_signup_cta_clicked` | User clicks the signup CTA on the pricing page | `app/pricing/pricing-signup-cta.tsx` |
| `signup_cta_clicked` | User clicks the signup CTA button on the homepage | `components/homepage-signup-cta.tsx` |
| `upgrade_cta_clicked` | Free user clicks the 'Upgrade to Pro' button in the tracker | `components/applications-tracker.tsx` |

## Files Created/Modified

### New Files
- `instrumentation-client.ts` - Client-side PostHog initialization
- `lib/posthog-server.ts` - Server-side PostHog client
- `components/posthog-identify.tsx` - User identification with Clerk
- `components/homepage-signup-cta.tsx` - Homepage CTA with tracking
- `app/pricing/pricing-signup-cta.tsx` - Pricing page CTA with tracking

### Modified Files
- `.env` - Added PostHog environment variables
- `next.config.ts` - Added reverse proxy rewrites for PostHog
- `app/layout.tsx` - Added PostHogIdentify component
- `app/page.tsx` - Integrated tracked signup CTA
- `app/pricing/page.tsx` - Added server-side page view tracking
- `components/add-application-form.tsx` - Added application tracking events
- `components/delete-application-button.tsx` - Added deletion tracking
- `components/editable-status-cell.tsx` - Added status change tracking
- `components/notes-dialog.tsx` - Added notes and upgrade prompt tracking
- `components/applications-tracker.tsx` - Added upgrade CTA tracking

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://eu.posthog.com/project/113824/dashboard/479439) - Your main analytics dashboard

### Insights
- [Job Applications Added Over Time](https://eu.posthog.com/project/113824/insights/9Q0yGAeQ) - Track daily application volume
- [Signup to First Application Funnel](https://eu.posthog.com/project/113824/insights/yIrPLJww) - Conversion from signup to first use
- [Pricing Page to Upgrade Funnel](https://eu.posthog.com/project/113824/insights/Ji9W4jA5) - Track upgrade conversion
- [Application Status Changes](https://eu.posthog.com/project/113824/insights/fYkIueLf) - User engagement breakdown by status
- [Row Limit Reached (Churn Risk)](https://eu.posthog.com/project/113824/insights/NJGuIoPn) - Identify users hitting limits

## Environment Variables

The following environment variables have been configured in `.env`:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_nwz2NyOtZ6Cty5ZpvYb2BxjhpXQTz8nWk7wF8VGSUfv
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Make sure to add these to your production environment (Vercel, Netlify, etc.) as well.
