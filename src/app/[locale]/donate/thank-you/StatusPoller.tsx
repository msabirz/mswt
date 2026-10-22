"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { openCheckout, type CheckoutSession } from "@/components/forms/checkout";
import { formatRupees } from "@/lib/money";
import type { DonationStatus } from "@/lib/donations/status";

export type ThankYouStrings = Record<
  | "checking"
  | "checkingHint"
  | "paidTitle"
  | "paid"
  | "receipt"
  | "download"
  | "emailed"
  | "failedTitle"
  | "failed"
  | "retry"
  | "retrying"
  | "pendingTitle"
  | "pending"
  | "notFound"
  | "home",
  string
>;

const POLL_MS = 2000;
const GIVE_UP_MS = 60_000;
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? "");

type View = DonationStatus | { status: "checking" } | { status: "slow" };

function orderFromUrl(): string {
  return new URLSearchParams(window.location.search).get("order") ?? "";
}

export function StatusPoller({ locale, t }: { locale: string; t: ThankYouStrings }) {
  const [view, setView] = useState<View>({ status: "checking" });
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const order = orderFromUrl();
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/donations/${encodeURIComponent(order)}/status`, { cache: "no-store" });
        const data = (await res.json()) as DonationStatus;
        if (stopped) return;
        if (data.status === "paid" && !data.receiptNumber && Date.now() - started < GIVE_UP_MS) {
          timer = setTimeout(poll, POLL_MS);
          return;
        }
        if (data.status !== "pending") return setView(data);
      } catch {
        // Network hiccup: keep polling until the deadline.
      }
      if (Date.now() - started >= GIVE_UP_MS) return setView({ status: "slow" });
      timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (view.status !== "checking") heading.current?.focus();
  }, [view.status]);

  // Same donation, same details: reopen the gateway's checkout instead of a blank form (3.3.7).
  async function retry() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/donations/${encodeURIComponent(orderFromUrl())}/retry`, {
        method: "POST",
        cache: "no-store",
      });
      const data = (await res.json()) as
        (CheckoutSession & { status: "checkout" }) | { status: "paid" | "expired" };
      if (data.status === "checkout") return await openCheckout(data);
      if (data.status === "paid") return window.location.reload();
    } catch {
      // Fall through to a fresh donation.
    }
    router.push(`/${locale}/donate`);
  }

  const title =
    view.status === "checking"
      ? null
      : view.status === "paid"
        ? t.paidTitle
        : view.status === "failed"
          ? t.failedTitle
          : view.status === "slow" || view.status === "pending"
            ? t.pendingTitle
            : t.notFound;

  return (
    <div className="grid max-w-2xl gap-6">
      {title ? (
        <h2 ref={heading} tabIndex={-1} className="text-2xl">
          {title}
        </h2>
      ) : null}
      {/* One live region for the whole lifecycle, so each outcome is announced (4.1.3). */}
      <div role="status" aria-live="polite" className="grid gap-2">
        {view.status === "checking" ? (
          <>
            <p className="text-lg font-semibold text-fg-strong">{t.checking}</p>
            <p className="text-fg-muted">{t.checkingHint}</p>
          </>
        ) : null}
        {view.status === "paid" ? (
          <Alert tone="success">
            <p>{fill(t.paid, { amount: formatRupees(view.amountPaise, locale) })}</p>
            {view.receiptNumber ? <p>{fill(t.receipt, { number: view.receiptNumber })}</p> : null}
            {view.emailed ? <p>{t.emailed}</p> : null}
          </Alert>
        ) : null}
        {view.status === "failed" ? (
          <Alert tone="error">
            <p>{t.failed}</p>
          </Alert>
        ) : null}
        {view.status === "slow" || view.status === "pending" ? (
          <Alert tone="info">
            <p>{t.pending}</p>
          </Alert>
        ) : null}
      </div>
      {view.status === "paid" && view.receiptUrl ? (
        <div>
          <ButtonLink href={view.receiptUrl}>{t.download}</ButtonLink>
        </div>
      ) : null}
      {view.status === "failed" ? (
        <div>
          <Button type="button" onClick={retry} disabled={retrying} aria-disabled={retrying}>
            {retrying ? t.retrying : t.retry}
          </Button>
        </div>
      ) : null}
      {view.status !== "checking" ? (
        <div>
          <ButtonLink href={`/${locale}`} variant="secondary">
            {t.home}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
