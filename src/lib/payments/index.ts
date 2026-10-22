import { serverEnv } from "@/env/server";
import { isProduction } from "@/lib/secrets";
import { CashfreeProvider } from "./cashfree";
import { FakeProvider } from "./fake";
import type { PaymentProvider } from "./provider";

/**
 * The active gateway. Cashfree when its keys are set (or PAYMENT_PROVIDER=cashfree); otherwise the
 * fake gateway, which exists only outside production.
 */
export function getPaymentProvider(): PaymentProvider {
  const wanted = serverEnv.PAYMENT_PROVIDER ?? (serverEnv.CASHFREE_APP_ID ? "cashfree" : "fake");
  if (wanted === "fake") {
    if (isProduction()) throw new Error("The fake payment provider is not allowed in production");
    return new FakeProvider();
  }
  if (!serverEnv.CASHFREE_APP_ID || !serverEnv.CASHFREE_SECRET_KEY)
    throw new Error("CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required (see .env.example)");
  if (isProduction() && serverEnv.CASHFREE_ENV !== "production")
    console.warn("Production is using the Cashfree sandbox (CASHFREE_ENV=sandbox)");
  return new CashfreeProvider(
    serverEnv.CASHFREE_APP_ID,
    serverEnv.CASHFREE_SECRET_KEY,
    serverEnv.CASHFREE_ENV,
  );
}

export type { PaymentProvider } from "./provider";
