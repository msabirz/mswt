import type { Metadata } from "next";
import { requireCapability } from "@/lib/admin/guard";
import { getPaymentSettingsFresh } from "@/lib/payment-settings";
import { savePayments } from "../actions";
import { SettingsPage } from "../SettingsPage";

export const metadata: Metadata = { title: "Payments" };
const rupees = (p: number) => String(p / 100);

export default async function PaymentSettingsPage() {
  await requireCapability("settings.payment");
  const s = await getPaymentSettingsFresh();
  return (
    <SettingsPage
      title="Payments"
      intro="Amounts on the donate form. Amounts are in rupees. The minimum must be above ₹5; show 3 or 4 suggested amounts."
      id="pay"
      action={savePayments}
      fields={[
        {
          name: "min",
          label: "Minimum donation (₹)",
          required: true,
          inputMode: "numeric",
          defaultValue: s ? rupees(s.minAmountPaise) : "100",
          group: "mm",
        },
        {
          name: "max",
          label: "Maximum online donation (₹)",
          inputMode: "numeric",
          hint: "Leave empty for no maximum",
          defaultValue: s?.maxAmountPaise ? rupees(s.maxAmountPaise) : "",
          group: "mm",
        },
        {
          name: "presets",
          label: "Suggested amounts (₹)",
          required: true,
          hint: "3 or 4, comma-separated, e.g. 500, 1000, 2500, 5000",
          defaultValue: (s?.presetAmountsPaise ?? []).map(rupees).join(", "),
        },
        {
          name: "feeCoverEnabled",
          label: "Offer donors to cover the payment charges",
          type: "checkbox",
          defaultValue: s?.feeCoverEnabled ? "on" : "",
        },
        {
          name: "feePercent",
          label: "Payment charges to add (%)",
          inputMode: "numeric",
          hint: "e.g. 2 or 1.75 (0–10)",
          defaultValue: s ? String(s.feeCoverPercentBp / 100) : "0",
        },
      ]}
    />
  );
}
