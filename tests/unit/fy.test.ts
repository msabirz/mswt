import { describe, expect, it } from "vitest";
import { financialYear, financialYearRange, istParts } from "@/lib/dates/fy";

describe("financialYear", () => {
  it("puts 31 March 23:59:59 IST in the old year", () => {
    expect(financialYear(new Date("2027-03-31T23:59:59+05:30"))).toBe("2026-27");
  });
  it("puts 1 April 00:00 IST in the new year", () => {
    expect(financialYear(new Date("2027-04-01T00:00:00+05:30"))).toBe("2027-28");
  });
  it("uses IST, not UTC: 31 Mar 18:30Z is already 1 April in India", () => {
    expect(financialYear(new Date("2027-03-31T18:30:00Z"))).toBe("2027-28");
    expect(financialYear(new Date("2027-03-31T18:29:59Z"))).toBe("2026-27");
  });
  it("handles the century rollover in the label", () => {
    expect(financialYear(new Date("2099-06-01T12:00:00+05:30"))).toBe("2099-00");
  });
});

describe("financialYearRange", () => {
  it("returns IST boundaries", () => {
    const { start, end } = financialYearRange("2026-27");
    expect(start.toISOString()).toBe("2026-03-31T18:30:00.000Z");
    expect(end.toISOString()).toBe("2027-03-31T18:29:59.999Z");
    expect(financialYear(start)).toBe("2026-27");
    expect(financialYear(end)).toBe("2026-27");
  });
  it("rejects malformed labels", () => {
    expect(() => financialYearRange("2026-28")).toThrow();
    expect(() => financialYearRange("26-27")).toThrow();
  });
});

describe("istParts", () => {
  it("shifts by +05:30", () => {
    expect(istParts(new Date("2026-10-20T20:00:00Z"))).toEqual({ year: 2026, month: 10, day: 21 });
  });
});
