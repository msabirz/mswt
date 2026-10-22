import { Pool } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle as drizzleNeonWs } from "drizzle-orm/neon-serverless";
import type { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import { serverEnv } from "@/env/server";
import { db } from "./client";
import * as schema from "./schema";

export type Tx = PgTransaction<PgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

/**
 * Run `fn` in one database transaction. The Neon HTTP driver used for reads cannot hold a
 * transaction open, so on Neon this opens a short-lived WebSocket pool (Node 24 has a global
 * WebSocket) and closes it afterwards; any other Postgres uses the postgres.js client.
 */
export async function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const url = serverEnv.DATABASE_URL;
  if (!new URL(url).hostname.endsWith(".neon.tech")) {
    return db.transaction(fn);
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    return await drizzleNeonWs({ client: pool, schema }).transaction((tx) => fn(tx as unknown as Tx));
  } finally {
    await pool.end();
  }
}
