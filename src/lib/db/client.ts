import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { serverEnv } from "@/env/server";
import * as schema from "./schema";

export const db = drizzle(neon(serverEnv.DATABASE_URL), { schema });
