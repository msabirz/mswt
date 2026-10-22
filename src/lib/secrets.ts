import { serverEnv } from "@/env/server";

export const isProduction = () => serverEnv.VERCEL_ENV === "production";

/**
 * A secret that must be set in production. Locally, in CI and on previews without it, a fixed
 * development value is used instead, so the flow works end to end without real accounts.
 */
export function secret(name: string, value: string | undefined, devValue: string): string {
  if (value) return value;
  if (isProduction()) throw new Error(`${name} is not set (required in production; see .env.example)`);
  return devValue;
}
