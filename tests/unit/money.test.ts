import { describe, expect, it } from "vitest";
import { formatRupees, rupeesToPaise } from "@/lib/money";

describe("rupeesToPaise", () => {
  it.each([
    ["5000", 500000],
    ["1,00,000", 10000000],
    ["₹ 2,500.5", 250050],
    ["99.99", 9999],
    ["0", 0],
  ])("%s → %i paise", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });
  it.each(["", "abc", "-100", "10.999", "1e3"])("rejects %s", (input) => {
    expect(() => rupeesToPaise(input)).toThrow();
  });
});

describe("formatRupees", () => {
  it("uses Indian digit grouping", () => {
    expect(formatRupees(10000000)).toBe("₹1,00,000");
    expect(formatRupees(500000)).toBe("₹5,000");
  });
  it("shows paise only when present", () => {
    expect(formatRupees(250050)).toBe("₹2,500.50");
  });
  it("keeps Latin digits in Indic locales", () => {
    expect(formatRupees(10000000, "hi")).toBe("₹1,00,000");
  });
  it("rejects non-integer or negative paise", () => {
    expect(() => formatRupees(1.5)).toThrow();
    expect(() => formatRupees(-1)).toThrow();
  });
});
