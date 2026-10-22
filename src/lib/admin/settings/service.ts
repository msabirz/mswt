import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { recordAudit, type Actor } from "@/lib/audit";
import { appearanceSettings, emailSettings, organizationSettings, seoSettings } from "@/lib/db/schema";
import type { Tx } from "@/lib/db/tx";
import { AppearanceInput, EmailInput, OrganizationInput, SeoInput } from "./schemas";

// The only write path for these settings (admin pages, org:sync): validated, locked, audited.
// Callers revalidate the matching cache tag (src/lib/settings.ts) after the transaction commits.

async function updateRow(
  tx: Tx,
  table: PgTable & { id: unknown },
  entity: string,
  data: Record<string, unknown>,
  actor: Actor,
) {
  const idCol = (table as unknown as { id: Parameters<typeof eq>[0] }).id;
  const [before] = await tx.select().from(table).where(eq(idCol, 1)).for("update");
  const row = { ...data, updatedBy: actor.userId, updatedAt: new Date() };
  if (before) await tx.update(table).set(row).where(eq(idCol, 1));
  else await tx.insert(table).values({ id: 1, ...row });
  await recordAudit(tx, actor, {
    action: `settings.${entity}.update`,
    entityType: `${entity}_settings`,
    entityId: "1",
    before,
    after: data,
  });
}

export const updateOrganization = (tx: Tx, input: unknown, actor: Actor) =>
  updateRow(tx, organizationSettings, "organization", OrganizationInput.parse(input), actor);

export const updateSeo = (tx: Tx, input: unknown, actor: Actor) =>
  updateRow(tx, seoSettings, "seo", SeoInput.parse(input), actor);

export const updateEmail = (tx: Tx, input: unknown, actor: Actor) =>
  updateRow(tx, emailSettings, "email", EmailInput.parse(input), actor);

export const updateAppearance = (tx: Tx, input: unknown, actor: Actor) =>
  updateRow(tx, appearanceSettings, "appearance", AppearanceInput.parse(input), actor);
