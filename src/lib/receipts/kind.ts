import type { ReceiptKind } from "./numbering";

export type ReceiptKindInput = {
  wants80g: boolean;
  hasPan: boolean;
  causeIs80gEligible: boolean;
  mode: "online" | "cash" | "cheque" | "neft" | "upi_offline";
  totalPaise: number;
  cash80gLimitPaise: number;
};

export type ReceiptDecision = {
  kind: ReceiptKind;
  reason: "80g" | "no_pan" | "not_requested" | "cause" | "cash_limit";
};

/** Spec §4: an 80G receipt needs PAN, an 80G-eligible cause, and no cash above ₹2,000 (80G(5D)). */
export function decideReceiptKind(i: ReceiptKindInput): ReceiptDecision {
  if (i.mode === "cash" && i.totalPaise > i.cash80gLimitPaise)
    return { kind: "acknowledgement", reason: "cash_limit" };
  if (!i.causeIs80gEligible) return { kind: "acknowledgement", reason: "cause" };
  if (!i.wants80g) return { kind: "acknowledgement", reason: "not_requested" };
  if (!i.hasPan) return { kind: "acknowledgement", reason: "no_pan" };
  return { kind: "80g", reason: "80g" };
}
