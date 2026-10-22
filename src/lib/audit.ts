import type { Tx } from "@/lib/db/tx";
import { auditLog } from "@/lib/db/schema";

export type Actor = { userId: string | null; ip?: string | null; userAgent?: string | null };

/** Append-only audit entry (SEC-10); always written in the same transaction as the change. */
export async function recordAudit(
  tx: Tx,
  actor: Actor,
  entry: { action: string; entityType: string; entityId?: string | null; before?: unknown; after?: unknown },
): Promise<void> {
  await tx.insert(auditLog).values({
    actorUserId: actor.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ip: actor.ip ?? null,
    userAgent: actor.userAgent ?? null,
  });
}
