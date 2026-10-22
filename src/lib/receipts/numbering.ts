import { sql } from "drizzle-orm";
import type { Tx } from "@/lib/db/tx";

export type ReceiptKind = "80g" | "acknowledgement";

/** MSWT/2026-27/000123 for 80G receipts, MSWT/ACK/2026-27/000123 for acknowledgements (spec §4.2). */
export function formatReceiptNumber(kind: ReceiptKind, fy: string, seq: number): string {
  if (!/^\d{4}-\d{2}$/.test(fy)) throw new Error(`Bad financial year ${fy}`);
  if (!Number.isSafeInteger(seq) || seq < 1) throw new Error(`Bad receipt sequence ${seq}`);
  const n = String(seq).padStart(6, "0");
  return kind === "80g" ? `MSWT/${fy}/${n}` : `MSWT/ACK/${fy}/${n}`;
}

/**
 * Next number in the (kind, FY) series. The upsert locks the counter row until the surrounding
 * transaction ends, so concurrent confirmations queue up, and a rollback returns the number:
 * the series stays gapless and is never reused.
 */
export async function allocateReceiptNumber(
  tx: Tx,
  kind: ReceiptKind,
  fy: string,
): Promise<{ seq: number; number: string }> {
  const rows = await tx.execute<{ last_seq: number }>(sql`
    insert into receipt_sequences (kind, fy, last_seq) values (${kind}, ${fy}, 1)
    on conflict (kind, fy) do update set last_seq = receipt_sequences.last_seq + 1
    returning last_seq`);
  const list = (Array.isArray(rows) ? rows : (rows as { rows: { last_seq: number }[] }).rows) as {
    last_seq: number;
  }[];
  const seq = Number(list[0]?.last_seq);
  return { seq, number: formatReceiptNumber(kind, fy, seq) };
}
