"use client";

// Hands a created order to the payment gateway's checkout (shared by the donate form and the
// thank-you page's "Try again").

declare global {
  interface Window {
    Cashfree?: (opts: { mode: "sandbox" | "production" }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<{ error?: unknown }>;
    };
  }
}

export type CheckoutSession = {
  orderId: string;
  sessionId: string;
  provider: "cashfree" | "fake";
  mode: "sandbox" | "production";
};

const CASHFREE_SDK = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadCashfree(): Promise<NonNullable<Window["Cashfree"]>> {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CASHFREE_SDK;
    s.async = true;
    s.onload = () => (window.Cashfree ? resolve(window.Cashfree) : reject(new Error("Cashfree SDK missing")));
    s.onerror = () => reject(new Error("Cashfree SDK failed to load"));
    document.head.appendChild(s);
  });
}

/** Opens the gateway's checkout (or the test gateway outside production). */
export async function openCheckout(session: CheckoutSession): Promise<void> {
  if (session.provider === "fake") {
    // The test gateway is an API route, not a page, so a full navigation is right here.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/dev/fake-pay?order=${encodeURIComponent(session.orderId)}`);
    return;
  }
  const cashfree = (await loadCashfree())({ mode: session.mode });
  const result = await cashfree.checkout({ paymentSessionId: session.sessionId, redirectTarget: "_self" });
  if (result?.error) throw new Error("Checkout failed");
}
