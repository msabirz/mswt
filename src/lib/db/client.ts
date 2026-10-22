import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
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

export const db = createDb(serverEnv.DATABASE_URL);
