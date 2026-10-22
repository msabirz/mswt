import { assertPaise, type Paise } from "@/lib/money";

// Amount in words, Indian numbering (thousand, lakh, crore), as printed on receipts and cheques.
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const t = TENS[Math.floor(n / 10)] ?? "";
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

export function integerInWords(n: number): string {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Cannot spell ${n}`);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  if (crore) parts.push(`${integerInWords(crore)} Crore`);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  const thousand = Math.floor((n % 100_000) / 1000);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  const rest = n % 1000;
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** 125050 paise → "Rupees One Thousand Two Hundred Fifty and Fifty Paise Only". */
export function amountInWords(paise: Paise): string {
  assertPaise(paise);
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  const r = `Rupees ${integerInWords(rupees)}`;
  return p ? `${r} and ${belowHundred(p)} Paise Only` : `${r} Only`;
}
