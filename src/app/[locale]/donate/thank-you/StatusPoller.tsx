"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates/format";
import { formatRupees } from "@/lib/money";
import type { DonationStatus } from "@/lib/donations/status";
import { Button, ButtonLink } from "@/components/ui/Button";
import { openCheckout, type CheckoutSession } from "@/components/forms/checkout";

export type ThankYouStrings = Record<
  | "checking"
  | "checkingHint"
  | "paidTitle"
  | "paidLead"
  | "amountLabel"
  | "receiptTitle"
  | "receiptNumber"
  | "kind80g"
  | "kindAck"
  | "towards"
  | "generalFund"
  | "date"
  | "email"
  | "emailSent"
  | "emailPending"
  | "preparing"
  | "download"
  | "nextTitle"
  | "next1"
  | "next2For80g"
  | "next2Ack"
  | "next3"
  | "transparency"
  | "share"
  | "shareText"
  | "copied"
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

type Paid = Extract<DonationStatus, { status: "paid" }>;
type View = DonationStatus | { status: "checking" } | { status: "slow" };

function orderFromUrl(): string {
  return new URLSearchParams(window.location.search).get("order") ?? "";
}

const pop = "motion-safe:animate-[thank-you-pop_var(--duration-slow)_var(--ease-standard)_both]";
const rise = "motion-safe:animate-[thank-you-rise_var(--duration-slow)_var(--ease-standard)_both]";

/** The round badge at the top of each outcome. */
function Badge({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mx-auto grid size-20 place-items-center rounded-full ring-8",
        tone === "success" && "bg-bg-brand text-fg-on-brand ring-bg-brand-subtle",
        tone === "error" && "bg-status-error-solid-bg text-status-error-solid-fg ring-status-error-bg",
        tone === "info" && "bg-status-info-solid-bg text-status-info-solid-fg ring-status-info-bg",
        pop,
      )}
    >
      {children}
    </span>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const CROSS = "M7 7l10 10M17 7L7 17";
const CLOCK = "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z";

function ReceiptCard({ view, locale, t }: { view: Paid; locale: Locale; t: ThankYouStrings }) {
  const rows: [string, ReactNode][] = [
    [
      t.receiptNumber,
      <span key="n" className="font-mono text-sm break-all">
        {view.receiptNumber}
      </span>,
    ],
    [t.towards, view.cause ?? t.generalFund],
    ...(view.receivedAt
      ? ([[t.date, formatDate(locale, new Date(view.receivedAt))]] as [string, ReactNode][])
      : []),
    [
      t.email,
      view.emailed ? (
        <span key="e" className="inline-flex items-center gap-1.5 text-status-success-fg-on-canvas">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path d={CHECK} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.emailSent}
        </span>
      ) : (
        t.emailPending
      ),
    ],
  ];
  return (
    <section
      aria-labelledby="receipt-h"
      className={cn(
        "overflow-hidden rounded-lg border border-border-decorative bg-bg-canvas shadow-sm",
        rise,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border-input bg-bg-subtle px-5 py-4">
        <h2 id="receipt-h" className="text-lg">
          {t.receiptTitle}
        </h2>
        {view.kind ? (
          <span className="rounded-full bg-bg-brand-subtle px-3 py-1 text-sm font-semibold text-fg-brand">
            {view.kind === "80g" ? t.kind80g : t.kindAck}
          </span>
        ) : null}
      </div>
      {view.receiptNumber ? (
        <div className="grid gap-5 p-5">
          <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-0.5">
                <dt className="text-sm text-fg-muted">{label}</dt>
                <dd className="m-0 font-semibold text-fg-strong">{value}</dd>
              </div>
            ))}
          </dl>
          {view.receiptUrl ? (
            <ButtonLink href={view.receiptUrl} block>
              {t.download}
            </ButtonLink>
          ) : null}
        </div>
      ) : (
        <p className="m-0 p-5 text-fg-muted">{t.preparing}</p>
      )}
    </section>
  );
}

function NextSteps({ view, locale, t }: { view: Paid; locale: Locale; t: ThankYouStrings }) {
  const steps = [t.next1, view.kind === "80g" ? t.next2For80g : t.next2Ack, t.next3];
  return (
    <section aria-labelledby="next-h" className={cn("grid gap-4", rise)}>
      <h2 id="next-h" className="text-lg">
        {t.nextTitle}
      </h2>
      <ol className="m-0 grid list-none gap-3 p-0">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-4 rounded-md bg-bg-subtle p-4">
            <span
              aria-hidden="true"
              className="grid size-8 flex-none place-items-center rounded-full bg-bg-brand text-sm font-bold text-fg-on-brand"
            >
              {i + 1}
            </span>
            <span className="self-center">
              {s}
              {i === 2 ? (
                <>
                  {" "}
                  <a
                    href={`/${locale}/transparency`}
                    className="font-semibold text-link-default underline underline-offset-4"
                  >
                    {t.transparency}
                  </a>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShareButton({ locale, t }: { locale: Locale; t: ThankYouStrings }) {
  const [copied, setCopied] = useState(false);
  // Shares the Trust's home page, never this page: its address identifies the donation.
  async function share() {
    const url = `${window.location.origin}/${locale}`;
    try {
      if (navigator.share) return await navigator.share({ text: t.shareText, url });
      await navigator.clipboard.writeText(`${t.shareText} ${url}`);
      setCopied(true);
    } catch {
      // Cancelled by the donor: nothing to do.
    }
  }
  return (
    <>
      <Button type="button" variant="secondary" onClick={share}>
        {t.share}
      </Button>
      <span aria-live="polite" className="text-sm text-fg-muted">
        {copied ? t.copied : ""}
      </span>
    </>
  );
}

export function StatusPoller({ locale, t }: { locale: Locale; t: ThankYouStrings }) {
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
        const res = await fetch(`/api/donations/${encodeURIComponent(order)}/status?locale=${locale}`, {
          cache: "no-store",
        });
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
  }, [locale]);

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

  const s = view.status;
  const title =
    s === "checking"
      ? t.checking
      : s === "paid"
        ? t.paidTitle
        : s === "failed"
          ? t.failedTitle
          : s === "slow" || s === "pending"
            ? t.pendingTitle
            : t.notFound;
  const home = (
    <ButtonLink href={`/${locale}`} variant={s === "paid" ? "secondary" : "primary"}>
      {t.home}
    </ButtonLink>
  );

  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <div className="grid justify-items-center gap-4 text-center">
        {s === "checking" ? (
          <span
            aria-hidden="true"
            className="size-16 animate-spin rounded-full border-4 border-bg-muted border-t-action-primary-bg motion-reduce:animate-none"
          />
        ) : s === "paid" ? (
          <Badge tone="success">
            <Icon d={CHECK} />
          </Badge>
        ) : s === "failed" || s === "not_found" ? (
          <Badge tone="error">
            <Icon d={CROSS} />
          </Badge>
        ) : (
          <Badge tone="info">
            <Icon d={CLOCK} />
          </Badge>
        )}
        <h1 ref={heading} tabIndex={-1} className="text-3xl text-balance lg:text-4xl">
          {title}
        </h1>
        {/* One live region for the whole lifecycle, so each outcome is announced (4.1.3). */}
        <div role="status" aria-live="polite" className="grid justify-items-center gap-3">
          {s === "checking" ? <p className="text-fg-muted">{t.checkingHint}</p> : null}
          {s === "paid" ? (
            <>
              <p className="m-0 grid gap-1">
                <span className="text-sm font-semibold tracking-wide text-fg-muted uppercase">
                  {t.amountLabel}
                </span>
                <span className={cn("text-5xl font-bold text-fg-brand", pop)}>
                  {formatRupees(view.amountPaise, locale)}
                </span>
              </p>
              <p className="max-w-lg text-lg text-fg-muted">{t.paidLead}</p>
            </>
          ) : null}
          {s === "failed" ? <p className="max-w-lg text-lg text-fg-muted">{t.failed}</p> : null}
          {s === "slow" || s === "pending" ? (
            <p className="max-w-lg text-lg text-fg-muted">{t.pending}</p>
          ) : null}
        </div>
      </div>

      {s === "paid" ? (
        <>
          <ReceiptCard view={view} locale={locale} t={t} />
          <NextSteps view={view} locale={locale} t={t} />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ShareButton locale={locale} t={t} />
            {home}
          </div>
        </>
      ) : null}
      {s === "failed" ? (
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={retry} disabled={retrying} aria-disabled={retrying}>
            {retrying ? t.retrying : t.retry}
          </Button>
          <ButtonLink href={`/${locale}`} variant="secondary">
            {t.home}
          </ButtonLink>
        </div>
      ) : null}
      {s === "slow" || s === "pending" || s === "not_found" ? (
        <div className="flex justify-center">{home}</div>
      ) : null}
    </div>
  );
}
