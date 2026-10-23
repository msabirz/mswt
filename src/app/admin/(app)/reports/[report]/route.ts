import { headers } from "next/headers";
import { parseFilters } from "@/lib/admin/donations";
import { tableResponse } from "@/lib/admin/exports";
import { requireCapability } from "@/lib/admin/guard";
import { panAccessUntil } from "@/lib/admin/pan-access";
import { buildReport, REPORTS, type ReportKey } from "@/lib/admin/reports";
import { recordAudit } from "@/lib/audit";
import { withTx } from "@/lib/db/tx";
import { clientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** One report for one FY as CSV or Excel (Accountant, Super Admin). */
export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  const admin = await requireCapability("reports.export");
  const { report } = await params;
  if (!(report in REPORTS)) return new Response("Unknown report", { status: 404 });
  const q = Object.fromEntries(new URL(request.url).searchParams);
  const { fy, cause } = parseFilters(q);
  if (!fy) return new Response("Choose a financial year", { status: 400 });
  const format = q.format === "xlsx" ? "xlsx" : "csv";
  const fullPan = Boolean(await panAccessUntil(admin.id));
  const table = await buildReport(report as ReportKey, { fy, cause }, fullPan);
  const h = await headers();
  await withTx((tx) =>
    recordAudit(
      tx,
      { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") },
      {
        action: fullPan ? "pan.exported" : "report.export",
        entityType: "report",
        entityId: report,
        after: { fy, cause: cause ?? null, format, rows: table.rows.length },
      },
    ),
  );
  return tableResponse(table, format, `mswt-${report}-${fy}`);
}
