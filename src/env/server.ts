import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Server-only secrets. Imported only by code that needs them, so static pages build without them.
export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url(),
  },
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
