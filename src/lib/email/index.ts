import { serverEnv } from "@/env/server";
import { isProduction } from "@/lib/secrets";
import { BrevoProvider } from "./brevo";
import type { EmailMessage, EmailProvider } from "./provider";

/** Keeps sent messages in memory (local, CI, previews without a key); tests read `sentEmails`. */
export const sentEmails: EmailMessage[] = ((globalThis as { __sentEmails?: EmailMessage[] }).__sentEmails ??=
  []);

class MemoryProvider implements EmailProvider {
  readonly name = "memory" as const;
  async send(m: EmailMessage) {
    sentEmails.push(m);
    console.info(`[email:memory] to=${m.to.email} subject="${m.subject}"`);
    return { messageId: `memory-${sentEmails.length}` };
  }
}

export function getEmailProvider(): EmailProvider {
  if (serverEnv.BREVO_API_KEY) {
    if (!serverEnv.EMAIL_FROM_ADDRESS) throw new Error("EMAIL_FROM_ADDRESS is required with BREVO_API_KEY");
    return new BrevoProvider(serverEnv.BREVO_API_KEY, {
      email: serverEnv.EMAIL_FROM_ADDRESS,
      name: serverEnv.EMAIL_FROM_NAME,
    });
  }
  if (isProduction()) throw new Error("BREVO_API_KEY is not set (required in production)");
  return new MemoryProvider();
}

export type { EmailMessage, EmailProvider } from "./provider";
