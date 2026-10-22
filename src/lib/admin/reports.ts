import { decryptPiiForDisplay, maskPan } from "@/lib/crypto/pii";
import { allDonations, type DonationFilters, type DonationRow } from "./donations";
import type { Table } from "./exports";

// Accountant reports (spec §5 Reports), all built from the same donation query as the list.
// Registers list paid donations with their live receipt; amounts are paise until export.

export const REPORTS = {
  register: "FY donation register",
  causes: "Cause-wise summary",
  "80g": "80G receipt register",
  acknowledgements: "Acknowledgement register",
  modes: "Mode-wise summary",
} as const;
export type ReportKey = keyof typeof REPORTS;

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  cash: "Cash",
  cheque: "Cheque",
  neft: "Bank transfer",
  upi_offline: "UPI (offline)",
};
const ist = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", dateStyle: "short" }).format(d) : "";
const address = (r: DonationRow) =>
  r.address
    ? [r.address.line1, r.address.line2, r.address.city, r.address.state, r.address.pincode]
        .filter(Boolean)
        .join(", ")
    : "";

/** Full PAN only when the caller holds an open PAN window; otherwise masked. */
const panOf = (r: DonationRow, full: boolean) =>
  r.panEnc ? (full ? decryptPiiForDisplay(r.panEnc) : maskPan(r.panLast4)) : "";

export function donationTable(rows: DonationRow[], fullPan: boolean): Table {
  return {
    columns: [
      { header: "Date (IST)", width: 12 },
      { header: "Receipt no.", width: 24 },
      { header: "Receipt type", width: 14 },
      { header: "Donor", width: 24 },
      { header: "Email", width: 26 },
      { header: "Phone", width: 13 },
      { header: "PAN", width: 12 },
      { header: "Address", width: 40 },
      { header: "Mode", width: 14 },
      { header: "Reference", width: 22 },
      { header: "Cause", width: 22 },
      { header: "Donation (₹)", kind: "amount" },
      { header: "Charges covered (₹)", kind: "amount" },
      { header: "Total (₹)", kind: "amount" },
      { header: "Status", width: 10 },
      { header: "Order ID", width: 24 },
    ],
    rows: rows.map((r) => [
      ist(r.receivedAt ?? r.createdAt),
      r.receiptNumber,
      r.receiptKind === "80g" ? "80G" : r.receiptKind ? "Acknowledgement" : "",
      r.name,
      r.email,
      r.phone,
      panOf(r, fullPan),
      address(r),
      MODE_LABEL[r.mode] ?? r.mode,
      r.paymentId ?? r.instrumentRef,
      r.causeTitle ?? "General fund",
      r.amountPaise,
      r.feeCoverPaise,
      r.totalPaise,
      r.status,
      r.publicOrderId,
    ]),
  };
}

function summary(rows: DonationRow[], key: (r: DonationRow) => string, label: string): Table {
  const groups = new Map<string, { n: number; sum: number }>();
  for (const r of rows) {
    const g = groups.get(key(r)) ?? { n: 0, sum: 0 };
    g.n += 1;
    g.sum += r.totalPaise;
    groups.set(key(r), g);
  }
  const sorted = [...groups].sort((a, b) => b[1].sum - a[1].sum);
  const total = rows.reduce((t, r) => t + r.totalPaise, 0);
  return {
    columns: [
      { header: label, width: 30 },
      { header: "Donations", kind: "count" },
      { header: "Total (₹)", kind: "amount" },
    ],
    rows: [...sorted.map(([k, g]) => [k, g.n, g.sum]), ["Total", rows.length, total]],
  };
}

/** Builds a report for one financial year (optionally one cause). */
export async function buildReport(
  key: ReportKey,
  f: Pick<DonationFilters, "fy" | "cause">,
  fullPan: boolean,
): Promise<Table> {
  const paid = await allDonations({ ...f, status: "paid" });
  switch (key) {
    case "register":
      return donationTable(paid, fullPan);
    case "80g":
      return donationTable(
        paid.filter((r) => r.receiptKind === "80g"),
        fullPan,
      );
    case "acknowledgements":
      return donationTable(
        paid.filter((r) => r.receiptKind === "acknowledgement"),
        fullPan,
      );
    case "causes":
      return summary(paid, (r) => r.causeTitle ?? "General fund", "Cause");
    case "modes":
      return summary(paid, (r) => MODE_LABEL[r.mode] ?? r.mode, "Mode");
  }
}
