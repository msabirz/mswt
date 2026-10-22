import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Server-only secrets. Imported only by code that needs them, so static pages build without them.
// Donation-related values are optional here so local builds and CI run without real accounts;
// src/lib/secrets.ts refuses to fall back to development values in production.
export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    // Payments (Cashfree). PAYMENT_PROVIDER=fake is for tests and is refused in production.
    PAYMENT_PROVIDER: z.enum(["cashfree", "fake"]).optional(),
    CASHFREE_APP_ID: z.string().min(1).optional(),
    CASHFREE_SECRET_KEY: z.string().min(1).optional(),
    CASHFREE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
    // Cloudflare R2 (private bucket for receipt PDFs).
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_RECEIPTS_BUCKET: z.string().min(1).optional(),
    // Outbound email (Brevo).
    BREVO_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM_ADDRESS: z.email().optional(),
    EMAIL_FROM_NAME: z.string().min(1).default("MS Welfare Trust"),
    // Security.
    PII_ENCRYPTION_KEY: z.base64().optional(),
    RECEIPT_LINK_SECRET: z.string().min(32).optional(),
    CRON_SECRET: z.string().min(16).optional(),
  },
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
