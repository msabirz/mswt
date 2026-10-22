import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/admin/guard";
import { db } from "@/lib/db/client";
import { emailSettings } from "@/lib/db/schema";
import { saveEmail } from "../actions";
import { SettingsPage } from "../SettingsPage";

export const metadata: Metadata = { title: "Email" };

export default async function EmailSettingsPage() {
  await requireCapability("settings.email");
  const [s] = await db.select().from(emailSettings).where(eq(emailSettings.id, 1));
  return (
    <SettingsPage
      title="Email"
      intro="How emails from the site are signed and who gets admin alerts. The sending service and its keys are set by the developer."
      id="email"
      action={saveEmail}
      fields={[
        { name: "fromName", label: "Sender name", defaultValue: s?.fromName ?? "", group: "from" },
        {
          name: "fromAddress",
          label: "Sender address",
          type: "email",
          defaultValue: s?.fromAddress ?? "",
          group: "from",
        },
        { name: "replyTo", label: "Replies go to", type: "email", defaultValue: s?.replyTo ?? "" },
        {
          name: "adminAlertRecipients",
          label: "Admin alert recipients",
          type: "textarea",
          rows: 3,
          hint: "One email per line",
          defaultValue: (s?.adminAlertRecipients ?? []).join("\n"),
        },
      ]}
    />
  );
}
