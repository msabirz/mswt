import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireCapability } from "@/lib/admin/guard";
import { causeOptions } from "@/lib/admin/donations";
import { panAccessUntil } from "@/lib/admin/pan-access";
import { REPORTS } from "@/lib/admin/reports";
import { financialYear } from "@/lib/dates/fy";
import { PanAccessPanel } from "@/components/admin/PanAccessPanel";
import { Card, compactControl, PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Reports" };

const DESCRIPTIONS: Record<keyof typeof REPORTS, string> = {
  register: "Every paid donation with its receipt, donor and payment details.",
  causes: "Totals per cause.",
  "80g": "80G receipts only, for the Form 10BD filing.",
  acknowledgements: "Acknowledgement receipts (no PAN, cash above ₹2,000, non-80G causes).",
  modes: "Totals per payment mode.",
};

export default async function ReportsPage() {
  const admin = await requireCapability("reports.export");
  const [causes, until] = await Promise.all([causeOptions(), panAccessUntil(admin.id)]);
  const current = financialYear(new Date());
  const start = Number(current.slice(0, 4));
  const years = Array.from(
    { length: 5 },
    (_, i) => `${start - i}-${String((start - i + 1) % 100).padStart(2, "0")}`,
  );
  return (
    <>
      <PageHeader
        title="Reports"
        description="Financial-year reports (1 April – 31 March, IST), as CSV or Excel. PAN is masked unless you unlock it below."
      />
      <PanAccessPanel until={until} path="/admin/reports" />
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(REPORTS) as (keyof typeof REPORTS)[]).map((key) => (
          <Card key={key} className="grid content-between gap-4 p-5">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold text-fg-strong">{REPORTS[key]}</h2>
              <p className="m-0 text-sm text-fg-muted">{DESCRIPTIONS[key]}</p>
            </div>
            <form method="get" action={`/admin/reports/${key}`} className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1">
                <label htmlFor={`${key}-fy`} className="text-xs font-semibold text-fg-muted">
                  Financial year
                </label>
                <select id={`${key}-fy`} name="fy" defaultValue={current} className={compactControl}>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
              {key !== "causes" ? (
                <div className="grid gap-1">
                  <label htmlFor={`${key}-cause`} className="text-xs font-semibold text-fg-muted">
                    Cause
                  </label>
                  <select id={`${key}-cause`} name="cause" defaultValue="" className={compactControl}>
                    <option value="">All</option>
                    <option value="general">General fund</option>
                    {causes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title ?? c.slug}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="flex gap-2">
                {(["csv", "xlsx"] as const).map((format) => (
                  <button
                    key={format}
                    type="submit"
                    name="format"
                    value={format}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-input bg-bg-canvas px-3 text-sm font-semibold hover:bg-bg-subtle"
                  >
                    <Download aria-hidden="true" className="size-4" />
                    {format === "csv" ? "CSV" : "Excel"}
                  </button>
                ))}
              </div>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
