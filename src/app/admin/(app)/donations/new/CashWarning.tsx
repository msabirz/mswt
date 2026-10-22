"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";

/**
 * Warns while the form says "cash" above the 80G(5D) limit, and asks once more before saving
 * (spec §4.4: "Admin form warns before saving").
 */
export function CashWarning({ limitRupees }: { limitRupees: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const form = box.current?.closest("form");
    if (!form) return;
    const check = () => {
      const mode = (form.elements.namedItem("mode") as HTMLSelectElement | null)?.value;
      const amount = Number(
        ((form.elements.namedItem("amount") as HTMLInputElement | null)?.value ?? "").replace(/[₹,\s]/g, ""),
      );
      return mode === "cash" && amount > limitRupees;
    };
    const onInput = () => setOver(check());
    const onSubmit = (e: Event) => {
      if (
        check() &&
        !window.confirm(
          `Cash above ₹${limitRupees.toLocaleString("en-IN")} gets an acknowledgement, not an 80G receipt. Save anyway?`,
        )
      )
        e.preventDefault();
    };
    form.addEventListener("input", onInput);
    form.addEventListener("submit", onSubmit, true);
    return () => {
      form.removeEventListener("input", onInput);
      form.removeEventListener("submit", onSubmit, true);
    };
  }, [limitRupees]);
  return (
    <div ref={box} aria-live="polite">
      {over ? (
        <Alert tone="warning">
          <p>
            Cash above ₹{limitRupees.toLocaleString("en-IN")} can’t get an 80G receipt (Section 80G(5D)). The
            donor gets an acknowledgement instead.
          </p>
        </Alert>
      ) : null}
    </div>
  );
}
