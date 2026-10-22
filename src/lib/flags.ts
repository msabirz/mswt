/** The /styleguide page exists on local builds and Vercel previews, never in production. */
export function styleguideEnabled(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv !== "production";
}
