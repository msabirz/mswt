import { and, desc, eq, gte, ilike, isNull, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { recordAudit, type Actor } from "@/lib/audit";
import { encryptPii, piiLookupHash } from "@/lib/crypto/pii";
import { financialYear } from "@/lib/dates/fy";
import { db } from "@/lib/db/client";
import { causes, causeTranslations, donations, donors, paymentSettings, receipts } from "@/lib/db/schema";
import { withTx } from "@/lib/db/tx";
import { deliverReceipt } from "@/lib/donations/deliver";
import { PAN_RE } from "@/lib/donations/schema";
import { decideReceiptKind } from "@/lib/receipts/kind";
import { allocateReceiptNumber } from "@/lib/receipts/numbering";

// Admin donation queries and receipt corrections (spec §5 Donations, §4.10). Every write is
// audited; the donor snapshot on a donation changes only through a reissue.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const opt = <T extends z.ZodType>(s: T) => z.preprocess((v) => (v === "" ? undefined : v), s.optional());

export const DonationFilters = z.object({
  fy: opt(z.string().regex(/^\d{4}-\d{2}$/)),
  from: opt(z.string().regex(DATE)),
  to: opt(z.string().regex(DATE)),
  cause: opt(z.union([z.literal("general"), z.uuid()])),
  mode: opt(z.enum(["online", "cash", "cheque", "neft", "upi_offline"])),
  status: opt(z.enum(["created", "pending", "paid", "failed", "expired", "refunded"])),
  kind: opt(z.enum(["80g", "acknowledgement"])),
  min: opt(z.coerce.number().nonnegative()),
  max: opt(z.coerce.number().nonnegative()),
  q: opt(z.string().trim().max(100)),
  page: opt(z.coerce.number().int().min(1)),
});
export type DonationFilters = z.output<typeof DonationFilters>;

/** Parse filters from a query string; invalid values are dropped, not errors. */
export function parseFilters(params: Record<string, string | string[] | undefined>): DonationFilters {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(DonationFilters.shape)) {
    const r = (schema as z.ZodType).safeParse(flat[key]);
    if (r.success && r.data !== undefined) out[key] = r.data;
  }
  return out as DonationFilters;
}

const istDay = (d: string) => new Date(`${d}T00:00:00+05:30`);
/** When the donation happened: received date when paid, else when it was started. */
const when = sql`coalesce(${donations.receivedAt}, ${donations.createdAt})`;

export function filterConditions(f: DonationFilters): SQL[] {
  const c: SQL[] = [];
  if (f.fy) c.push(eq(donations.fy, f.fy));
  if (f.from) c.push(gte(when, istDay(f.from)));
  if (f.to) c.push(lt(when, new Date(istDay(f.to).getTime() + 86_400_000)));
  if (f.cause === "general") c.push(isNull(donations.causeId));
  else if (f.cause) c.push(eq(donations.causeId, f.cause));
  if (f.mode) c.push(eq(donations.mode, f.mode));
  if (f.status) c.push(eq(donations.status, f.status));
  if (f.kind) c.push(eq(receipts.kind, f.kind));
  if (f.min !== undefined) c.push(gte(donations.totalPaise, Math.round(f.min * 100)));
  if (f.max !== undefined) c.push(lte(donations.totalPaise, Math.round(f.max * 100)));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    c.push(
      or(
        ilike(donations.nameSnapshot, like),
        ilike(donations.emailSnapshot, like),
        ilike(donations.publicOrderId, like),
        ilike(receipts.number, like),
        ilike(donors.phone, like),
      )!,
    );
  }
  return c;
}

const listColumns = {
  id: donations.id,
  publicOrderId: donations.publicOrderId,
  name: donations.nameSnapshot,
  email: donations.emailSnapshot,
  phone: donors.phone,
  isAnonymous: donations.isAnonymous,
  amountPaise: donations.amountPaise,
  feeCoverPaise: donations.feeCoverPaise,
  totalPaise: donations.totalPaise,
  mode: donations.mode,
  status: donations.status,
  method: donations.providerPaymentMethod,
  paymentId: donations.providerPaymentId,
  instrumentRef: donations.instrumentRef,
  wants80g: donations.wants80g,
  panEnc: donations.panEncSnapshot,
  panLast4: donations.panLast4Snapshot,
  address: donations.addressSnapshot,
  fy: donations.fy,
  receivedAt: donations.receivedAt,
  createdAt: donations.createdAt,
  causeTitle: causeTranslations.title,
  receiptNumber: receipts.number,
  receiptKind: receipts.kind,
};
function baseQuery(f: DonationFilters) {
  return db
    .select(listColumns)
    .from(donations)
    .innerJoin(donors, eq(donors.id, donations.donorId))
    .leftJoin(causes, eq(causes.id, donations.causeId))
    .leftJoin(
      causeTranslations,
      and(eq(causeTranslations.causeId, causes.id), eq(causeTranslations.locale, "en")),
    )
    .leftJoin(receipts, and(eq(receipts.donationId, donations.id), isNull(receipts.voidedAt)))
    .where(and(...filterConditions(f)));
}

export const PAGE_SIZE = 50;

export async function listDonations(f: DonationFilters) {
  const page = f.page ?? 1;
  const [rows, [totals]] = await Promise.all([
    baseQuery(f)
      .orderBy(desc(when))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({
        n: sql<number>`count(*)::int`,
        sum: sql<number>`coalesce(sum(${donations.totalPaise}) filter (where ${donations.status} = 'paid'), 0)::bigint`,
      })
      .from(donations)
      .innerJoin(donors, eq(donors.id, donations.donorId))
      .leftJoin(receipts, and(eq(receipts.donationId, donations.id), isNull(receipts.voidedAt)))
      .where(and(...filterConditions(f))),
  ]);
  return { rows, total: totals?.n ?? 0, paidSumPaise: Number(totals?.sum ?? 0), page };
}

/** All matching rows for exports and reports (capped). */
export async function allDonations(f: DonationFilters, cap = 50_000) {
  return baseQuery(f).orderBy(when).limit(cap);
}
export type DonationRow = Awaited<ReturnType<typeof allDonations>>[number];

export async function causeOptions() {
  return db
    .select({ id: causes.id, title: causeTranslations.title, slug: causes.slug })
    .from(causes)
    .leftJoin(
      causeTranslations,
      and(eq(causeTranslations.causeId, causes.id), eq(causeTranslations.locale, "en")),
    )
    .orderBy(causes.sortOrder);
}

// ── Receipt corrections ──────────────────────────────────────────────────────────────────────

export class ReceiptError extends Error {
  constructor(readonly code: "not_found" | "not_paid" | "voided" | "other_fy" | "pan" | "reason") {
    super(code);
  }
}

export async function voidReceipt(receiptId: string, reason: string, actor: Actor & { userId: string }) {
  if (reason.trim().length < 5) throw new ReceiptError("reason");
  await withTx(async (tx) => {
    const [r] = await tx.select().from(receipts).where(eq(receipts.id, receiptId)).for("update");
    if (!r) throw new ReceiptError("not_found");
    if (r.voidedAt) throw new ReceiptError("voided");
    await tx
      .update(receipts)
      .set({ voidedAt: new Date(), voidReason: reason.trim(), voidedByUserId: actor.userId })
      .where(eq(receipts.id, receiptId));
    await recordAudit(tx, actor, {
      action: "receipt.void",
      entityType: "receipt",
      entityId: receiptId,
      after: { number: r.number, reason: reason.trim() },
    });
  });
}

export const ReissueInput = z.object({
  name: z.string().trim().min(1).max(120),
  wants80g: z.boolean(),
  pan: z.string().trim().toUpperCase().regex(PAN_RE).nullable(),
  address: z
    .object({
      line1: z.string().trim().min(1).max(200),
      line2: z.string().trim().max(200).optional(),
      city: z.string().trim().min(1).max(80),
      state: z.string().trim().min(1).max(80),
      pincode: z.string().regex(/^[1-9][0-9]{5}$/),
    })
    .nullable(),
  reason: z.string().trim().min(5).max(500),
});
export type ReissueInput = z.input<typeof ReissueInput>;

/**
 * Corrected receipt: voids the live one and issues a new number in the donation's FY and series
 * (spec §4.5, §4.10). Only within the same financial year as the donation.
 */
export async function reissueReceipt(
  donationId: string,
  input: ReissueInput,
  actor: Actor & { userId: string },
  now = new Date(),
): Promise<{ receiptId: string; number: string }> {
  const d = ReissueInput.parse(input);
  if (d.wants80g && !d.pan) throw new ReceiptError("pan");
  const result = await withTx(async (tx) => {
    const [don] = await tx.select().from(donations).where(eq(donations.id, donationId)).for("update");
    if (!don) throw new ReceiptError("not_found");
    if (don.status !== "paid" || !don.fy) throw new ReceiptError("not_paid");
    if (financialYear(now) !== don.fy) throw new ReceiptError("other_fy");
    const [live] = await tx
      .select()
      .from(receipts)
      .where(and(eq(receipts.donationId, donationId), isNull(receipts.voidedAt)))
      .for("update");

    const panEnc = d.pan ? encryptPii(d.pan) : null;
    await tx
      .update(donations)
      .set({
        nameSnapshot: d.name,
        wants80g: d.wants80g,
        panEncSnapshot: panEnc,
        panLast4Snapshot: d.pan ? d.pan.slice(-4) : null,
        addressSnapshot: d.address,
        updatedAt: now,
      })
      .where(eq(donations.id, donationId));
    // Keep the donor record in step when a PAN is added, unless another donor already has that PAN
    // (then the duplicate is resolved by merging donors, not here).
    if (d.pan) {
      const panHmac = piiLookupHash(d.pan);
      const [owner] = await tx.select({ id: donors.id }).from(donors).where(eq(donors.panHmac, panHmac));
      if (!owner || owner.id === don.donorId)
        await tx
          .update(donors)
          .set({ panEnc, panLast4: d.pan.slice(-4), panHmac, updatedAt: now })
          .where(eq(donors.id, don.donorId));
    }

    if (live)
      await tx
        .update(receipts)
        .set({ voidedAt: now, voidReason: `Reissued: ${d.reason}`, voidedByUserId: actor.userId })
        .where(eq(receipts.id, live.id));

    const [settings] = await tx
      .select({ cashLimit: paymentSettings.cash80gLimitPaise })
      .from(paymentSettings);
    const [cause] = don.causeId
      ? await tx.select({ is80g: causes.is80gEligible }).from(causes).where(eq(causes.id, don.causeId))
      : [{ is80g: true }];
    const decision = decideReceiptKind({
      wants80g: d.wants80g,
      hasPan: Boolean(d.pan),
      causeIs80gEligible: cause?.is80g ?? true,
      mode: don.mode,
      totalPaise: don.totalPaise,
      cash80gLimitPaise: settings?.cashLimit ?? 200000,
    });
    const { seq, number } = await allocateReceiptNumber(tx, decision.kind, don.fy);
    const [created] = await tx
      .insert(receipts)
      .values({
        donationId,
        kind: decision.kind,
        number,
        fy: don.fy,
        seq,
        replacesReceiptId: live?.id ?? null,
      })
      .returning({ id: receipts.id });
    await recordAudit(tx, actor, {
      action: "receipt.reissue",
      entityType: "donation",
      entityId: donationId,
      before: live ? { number: live.number, kind: live.kind, name: don.nameSnapshot } : null,
      after: {
        number,
        kind: decision.kind,
        name: d.name,
        pan: d.pan ? `XXXXXX${d.pan.slice(-4)}` : null,
        reason: d.reason,
      },
    });
    return { receiptId: created!.id, number };
  });
  await deliverReceipt(result.receiptId).catch((error) =>
    console.error("Reissued receipt delivery failed", error),
  );
  return result;
}

/** Sends the same receipt PDF again. */
export async function resendReceipt(receiptId: string, actor: Actor) {
  const [r] = await db.select().from(receipts).where(eq(receipts.id, receiptId));
  if (!r) throw new ReceiptError("not_found");
  if (r.voidedAt) throw new ReceiptError("voided");
  await db.update(receipts).set({ emailedAt: null, emailMessageId: null }).where(eq(receipts.id, receiptId));
  await withTx((tx) =>
    recordAudit(tx, actor, {
      action: "receipt.resend",
      entityType: "receipt",
      entityId: receiptId,
      after: { number: r.number },
    }),
  );
  await deliverReceipt(receiptId);
}
