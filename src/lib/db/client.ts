import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/env/server";
import * as schema from "./schema";

// Neon (Vercel, local .env.local) uses the HTTP driver; any other Postgres (CI service container,
// a local Docker database) uses postgres.js over TCP. Both expose the same Drizzle API.
function createDb(url: string) {
  if (new URL(url).hostname.endsWith(".neon.tech")) return drizzleNeon(neon(url), { schema });
  return drizzlePostgres(postgres(url, { max: 5, onnotice: () => {} }), { schema });
}

// Typed as the drivers' common base so queries type-check the same way on both.
// Transactions go through withTx (src/lib/db/tx.ts): the Neon HTTP driver cannot hold one open.
export const db: PgDatabase<PgQueryResultHKT, typeof schema> = createDb(serverEnv.DATABASE_URL);
