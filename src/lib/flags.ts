/** The /styleguide page exists on local builds and Vercel previews, never in production. */
export function styleguideEnabled(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv !== "production";
}

/**
 * Online donations: on locally and on previews (Cashfree sandbox), off in production until the
 * Trust goes live (Step 12: Cashfree production keys, Trust facts on receipts, approved legal pages).
 * Set NEXT_PUBLIC_DONATIONS_LIVE=true in Vercel production to switch on.
 */
export function donationsEnabled(
  vercelEnv: string | undefined = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV,
  live: string | undefined = process.env.NEXT_PUBLIC_DONATIONS_LIVE,
): boolean {
  return vercelEnv !== "production" || live === "true";
}
