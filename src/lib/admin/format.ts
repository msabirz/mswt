import { formatRupees } from "@/lib/money";
import type { Tone } from "@/components/ui/Alert";

// Display helpers for the admin (English, Indian digit grouping, IST).
export const inr = (paise: number | string | null | undefined) => formatRupees(Number(paise ?? 0), "en");

export function istDateTime(d: Date | null | undefined): string {
  return d
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(d)
    : "–";
}

export function istDate(d: Date | null | undefined): string {
  return d
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(d)
    : "–";
}

export const MODE_LABELS: Record<string, string> = {
  online: "Online",
  cash: "Cash",
  cheque: "Cheque",
  neft: "Bank transfer",
  upi_offline: "UPI (offline)",
};

export const STATUS_TONE: Record<string, Tone | "neutral"> = {
  paid: "success",
  pending: "warning",
  created: "neutral",
  failed: "error",
  expired: "neutral",
  refunded: "info",
};

export const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  created: "Started",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
};
