// Throwaway local Postgres for tests that write to the database (never point those at Neon).
//   npm run db:local          → starts Postgres 17 on :5433 with data in .data/pg, Ctrl+C to stop
// Then run, in another terminal:
//   DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres npm run db:migrate   (and test:db, build, test:e2e)
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dir = ".data/pg";
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  port: 5433,
  user: "postgres",
  password: "postgres",
  persistent: true,
});
if (!existsSync(dir)) await pg.initialise();
await pg.start();
console.log("Local Postgres ready: postgres://postgres:postgres@127.0.0.1:5433/postgres (Ctrl+C to stop)");
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
