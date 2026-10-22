import writeExcelFile from "write-excel-file/node";

// Report/export tables → CSV or Excel. Amounts are paise in, rupees (2 decimals) out; dates are
// already IST text. Same table drives both formats.
export type ColumnKind = "text" | "amount" | "count";
export type Column = { header: string; kind?: ColumnKind; width?: number };
export type Table = { columns: Column[]; rows: (string | number | null)[][] };

const rupees = (paise: number) => (paise / 100).toFixed(2);

/** Cells starting with these are formulas in Excel/Sheets: prefix with ' so they stay text. */
function safeText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cellText(value: string | number | null, kind: ColumnKind = "text"): string {
  if (value === null) return "";
  if (kind === "amount") return rupees(Number(value));
  if (kind === "count") return String(value);
  return safeText(String(value));
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel shows Hindi/Marathi/Gujarati correctly. */
export function toCsv(table: Table): string {
  const esc = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [
    table.columns.map((c) => esc(c.header)).join(","),
    ...table.rows.map((r) => r.map((v, i) => esc(cellText(v, table.columns[i]?.kind))).join(",")),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}

export async function toXlsx(table: Table): Promise<Buffer> {
  const header = table.columns.map((c) => ({ value: c.header, fontWeight: "bold" as const }));
  const rows = table.rows.map((r) =>
    r.map((v, i) => {
      const kind = table.columns[i]?.kind ?? "text";
      if (v === null) return null;
      if (kind === "amount") return { value: Number(v) / 100, type: Number, format: "#,##0.00" };
      if (kind === "count") return { value: Number(v), type: Number };
      return { value: safeText(String(v)), type: String };
    }),
  );
  const columns = table.columns.map((c) => ({ width: c.width ?? (c.kind === "amount" ? 14 : 18) }));
  return writeExcelFile([header, ...rows], { columns }).toBuffer();
}

/** Download response for a table, with an IST-dated filename. */
export async function tableResponse(
  table: Table,
  format: "csv" | "xlsx",
  baseName: string,
): Promise<Response> {
  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const filename = `${baseName}-${stamp}.${format}`;
  const headers = {
    "Cache-Control": "no-store, private",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (format === "csv")
    return new Response(toCsv(table), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
  return new Response(new Uint8Array(await toXlsx(table)), {
    headers: {
      ...headers,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
