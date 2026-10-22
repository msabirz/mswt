// Creates a Super Admin from the terminal (the first admin, or a recovery account).
// Usage: npm run admin:create            (asks for name, email and password; password is hidden)
//        npm run admin:create -- --force (even if an active Super Admin exists)
// The new admin sets up two-step verification at first sign-in. Nothing is printed or logged
// except the email address.
import { createInterface } from "node:readline/promises";
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

function hidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") process.exit(130); // Ctrl+C
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}
const { and, eq, sql } = await import("drizzle-orm");
const { db } = await import("../src/lib/db/client");
const { users } = await import("../src/lib/db/schema");
const { withTx } = await import("../src/lib/db/tx");
const { recordAudit } = await import("../src/lib/audit");
const { hashPassword, passwordProblem } = await import("../src/lib/auth/password");

const [existing] = await db
  .select({ n: sql<number>`count(*)::int` })
  .from(users)
  .where(and(eq(users.role, "super_admin"), eq(users.isActive, true)));
if ((existing?.n ?? 0) > 0 && !process.argv.includes("--force")) {
  console.error("An active Super Admin already exists. Invite users from the admin, or use --force.");
  process.exit(1);
}

console.log(`Creating a Super Admin on ${new URL(url).host}`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const name = (await rl.question("Full name: ")).trim();
const email = (await rl.question("Email: ")).trim().toLowerCase();
rl.close();
if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("A name and a valid email are required.");
  process.exit(1);
}
const password = await hidden("Password (hidden, 12+ characters): ");
const again = await hidden("Repeat the password: ");
if (password !== again) {
  console.error("The passwords don't match.");
  process.exit(1);
}
const problem = passwordProblem(password, [email, name]);
if (problem) {
  console.error(`Password not allowed (${problem}). Use at least 12 characters, not your name or email.`);
  process.exit(1);
}
const passwordHash = await hashPassword(password);
await withTx(async (tx) => {
  const [taken] = await tx
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`);
  if (taken) throw new Error("A user with this email already exists.");
  const [user] = await tx
    .insert(users)
    .values({ name, email, passwordHash, role: "super_admin" })
    .returning({ id: users.id });
  await recordAudit(
    tx,
    { userId: null, userAgent: "admin:create" },
    {
      action: "user.create_super_admin",
      entityType: "user",
      entityId: user!.id,
      after: { email, name, role: "super_admin" },
    },
  );
});
console.log(`Super Admin ${email} created. Sign in at /admin/login and set up two-step verification.`);
process.exit(0);
