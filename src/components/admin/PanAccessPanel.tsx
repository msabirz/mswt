import { ShieldCheck } from "lucide-react";
import { istDateTime } from "@/lib/admin/format";
import { requestPanCodeAction, verifyPanCodeAction } from "@/app/admin/(app)/pan/actions";
import { AdminForm } from "./AdminForm";
import { Card } from "./ui";

/** PAN window state: unlocked until a time, or the two-step "email me a code" → "enter code" forms. */
export function PanAccessPanel({ until, path }: { until: Date | null; path: string }) {
  if (until)
    return (
      <Card className="flex items-center gap-3 p-4 text-sm">
        <ShieldCheck aria-hidden="true" className="size-5 flex-none text-fg-brand" />
        <p className="m-0">
          Full PANs are visible until <strong>{istDateTime(until)}</strong>. Every view is recorded in the
          audit log.
        </p>
      </Card>
    );
  return (
    <Card className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
      <div className="grid content-start gap-2 text-sm">
        <h2 className="text-base font-semibold text-fg-strong">Full PAN is hidden</h2>
        <p className="m-0 text-fg-muted">
          To see full PANs for 15 minutes, get a one-time code by email and enter it here. Views are recorded
          in the audit log.
        </p>
        <AdminForm
          id="pan-request"
          action={requestPanCodeAction}
          submitLabel="Email me a code"
          variant="secondary"
          fields={[]}
        />
      </div>
      <AdminForm
        id="pan-code"
        columns={1}
        action={verifyPanCodeAction.bind(null, path)}
        submitLabel="Show full PANs"
        fields={[
          {
            name: "code",
            label: "Code from the email",
            autoComplete: "one-time-code",
            inputMode: "numeric",
            maxLength: 6,
          },
        ]}
      />
    </Card>
  );
}
