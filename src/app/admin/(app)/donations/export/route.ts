import { headers } from "next/headers";
import { allDonations, parseFilters } from "@/lib/admin/donations";
import { tableResponse } from "@/lib/admin/exports";
import { requireCapability } from "@/lib/admin/guard";
import { panAccessUntil } from "@/lib/admin/pan-access";
import { donationTable } from "@/lib/admin/reports";
import { recordAudit } from "@/lib/audit";
import { withTx } from "@/lib/db/tx";
import { clientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Filtered donations as CSV or Excel. Full PAN only while the admin's PAN window is open. */
export async function GET(request: Request) {
  const admin = await requireCapability("reports.export");
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const format = params.format === "xlsx" ? "xlsx" : "csv";
  const filters = parseFilters({ ...params, page: undefined });
  const fullPan = Boolean(await panAccessUntil(admin.id));
  const rows = await allDonations(filters);
  const h = await headers();
  await withTx((tx) =>
    recordAudit(
      tx,
      { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") },
      {
        action: fullPan ? "pan.exported" : "donations.export",
        entityType: "donation",
        after: { format, rows: rows.length, filters },
      },
    ),
  );
  return tableResponse(donationTable(rows, fullPan), format, "mswt-donations");
}
