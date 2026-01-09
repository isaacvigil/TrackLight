import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  // Return null if PostHog key is not configured
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    console.warn('PostHog API key not found. Analytics will be disabled.');
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(
      apiKey,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0
      }
    );
    if (process.env.NODE_ENV === 'development') {
      posthogClient.debug(true);
    }
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
