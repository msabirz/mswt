// Money is always integer paise. Convert and format only at the edges.
export type Paise = number;

export function assertPaise(value: number): asserts value is Paise {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid paise amount: ${value}`);
}

/** Parse a rupee amount typed by a person ("1,00,000", "2500.50") into paise. */
export function rupeesToPaise(input: string): Paise {
  const cleaned = input.replace(/[₹,\s]/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) throw new Error(`Not a rupee amount: "${input}"`);
  const paise = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  assertPaise(paise);
  return paise;
}

/** "₹1,00,000" (Indian digit grouping). Shows paise only when there are any. */
export function formatRupees(paise: Paise, locale = "en"): string {
  assertPaise(paise);
  const hasFraction = paise % 100 !== 0;
  return new Intl.NumberFormat(`${locale}-IN`, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
    numberingSystem: "latn",
  }).format(paise / 100);
}
