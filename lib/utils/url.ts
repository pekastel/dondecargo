import { env } from "@/lib/env";

/**
 * Utility function to determine the base URL of the application
 * based on Vercel environment variables or fallback to localhost
 *
 * Priority order:
 * 1. Custom domain (NEXT_PUBLIC_APP_URL)
 * 2. Production URL (VERCEL_PROJECT_PRODUCTION_URL)
 * 3. Branch/Preview URL (VERCEL_BRANCH_URL)
 * 4. Default Vercel URL (VERCEL_URL)
 * 5. BASE_URL environment variable
 * 6. Localhost fallback
 */
export function getBaseUrl(): string {
  // Custom domain has highest priority if explicitly set
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  // Netlify site URL (usually production primary domain)
  if (process.env.URL) {
    const url = process.env.URL;
    return url.startsWith("http") ? url : `https://${url}`;
  }

  // Netlify deploy URL (preview/branch/prod). Use process.env to avoid strict env schema.
  if (process.env.DEPLOY_URL) {
    const url = process.env.DEPLOY_URL;
    return url.startsWith("http") ? url : `https://${url}`;
  }

  // Production URL has second highest priority
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Preview deployment URL
  if (env.VERCEL_BRANCH_URL) {
    return `https://${env.VERCEL_BRANCH_URL}`;
  }

  // Default Vercel deployment URL
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  // In the browser, fall back to current origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // Default to localhost for development
  return env.BASE_URL;
}
