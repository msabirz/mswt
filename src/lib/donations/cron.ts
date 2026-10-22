import { serverEnv } from "@/env/server";
import { isProduction } from "@/lib/secrets";

/**
 * The bearer token Vercel Cron must send to /api/cron/reconcile; null when the job is not
 * configured (no CRON_SECRET in production). Outside production a fixed development value is used.
 */
export function cronSecret(
  value: string | undefined = serverEnv.CRON_SECRET,
  production: boolean = isProduction(),
): string | null {
  if (value) return value;
  return production ? null : "development-cron-secret";
}
