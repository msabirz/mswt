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
      intro="Emails sent by the site. The sending service and its keys are set by the developer."
      id="email"
      action={saveEmail}
      sections={[
        {
          title: "Sender",
          description: "How receipts and notices are signed. Replies go to the reply-to address.",
          fields: [
            { name: "fromName", label: "Sender name", defaultValue: s?.fromName ?? "" },
            {
              name: "fromAddress",
              label: "Sender address",
              type: "email",
              defaultValue: s?.fromAddress ?? "",
            },
            { name: "replyTo", label: "Replies go to", type: "email", defaultValue: s?.replyTo ?? "" },
          ],
        },
        {
          title: "Admin alerts",
          description: "Who is told about new donations and messages.",
          fields: [
            {
              name: "adminAlertRecipients",
              label: "Recipients",
              type: "textarea",
              rows: 3,
              hint: "One email per line",
              defaultValue: (s?.adminAlertRecipients ?? []).join("\n"),
            },
          ],
        },
      ]}
    />
  );
}
