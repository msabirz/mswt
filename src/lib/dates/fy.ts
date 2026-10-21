// Indian financial year (1 April – 31 March), always decided in Asia/Kolkata.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Calendar year, month (1–12) and day of an instant as seen in Asia/Kolkata. */
export function istParts(instant: Date): { year: number; month: number; day: number } {
  // IST has no daylight saving, so a fixed +05:30 offset is exact.
  const ist = new Date(instant.getTime() + IST_OFFSET_MS);
  return { year: ist.getUTCFullYear(), month: ist.getUTCMonth() + 1, day: ist.getUTCDate() };
}

/** Financial year label such as "2026-27" for the given instant. */
export function financialYear(instant: Date): string {
  const { year, month } = istParts(instant);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** First and last instants of a financial year label, e.g. "2026-27". */
export function financialYearRange(label: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(label);
  if (!match) throw new Error(`Invalid financial year "${label}"; expected e.g. 2026-27`);
  const startYear = Number(match[1]);
  if ((startYear + 1) % 100 !== Number(match[2]))
    throw new Error(`Financial year "${label}" is not consecutive`);
  const start = new Date(Date.UTC(startYear, 3, 1) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(startYear + 1, 3, 1) - IST_OFFSET_MS - 1);
  return { start, end };
}
