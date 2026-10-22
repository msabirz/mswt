"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorSummary, FormField, Input } from "@/components/ui/Form";
import { confirmSetupAction, finishSetupAction, type SetupState } from "../../actions";

export function SetupForm({ secret, qrSvg }: { secret: string | null; qrSvg: string | null }) {
  const [state, run, pending] = useActionState<SetupState, FormData>(confirmSetupAction, { status: "idle" });
  const codesHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (state.status === "error") document.getElementById("setup-summary")?.focus();
    if (state.recoveryCodes) codesHeading.current?.focus();
  }, [state]);

  if (state.recoveryCodes || !secret)
    return (
      <div className="grid gap-4">
        {state.recoveryCodes ? (
          <>
            <h2 ref={codesHeading} tabIndex={-1} className="text-xl">
              Save your recovery codes
            </h2>
            <Alert tone="warning">
              <p>
                Each code works once if you lose your phone. They are shown only now: print them or store them
                in a password manager.
              </p>
            </Alert>
            <ol className="grid grid-cols-2 gap-2 font-mono text-lg" aria-label="Recovery codes">
              {state.recoveryCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </>
        ) : null}
        <form action={finishSetupAction}>
          <Button type="submit">I have saved my codes – continue</Button>
        </form>
      </div>
    );

  const grouped = secret.match(/.{1,4}/g)?.join(" ") ?? secret;
  return (
    <form action={run} className="grid gap-6" noValidate>
      {state.status === "error" && state.errors ? (
        <ErrorSummary
          id="setup-summary"
          title="Please fix the following:"
          errors={Object.values(state.errors).map((message) => ({ fieldId: "setup-code", message }))}
        />
      ) : null}
      <ol className="grid list-decimal gap-4 pl-5">
        <li>
          <p>Scan this QR code with your authenticator app.</p>
          {qrSvg ? (
            <div
              role="img"
              aria-label="QR code for your authenticator app"
              className="mt-3 w-56 rounded-md bg-bg-canvas p-2"
              // The SVG is generated on the server from our own data (no user input).
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : null}
          <p className="mt-3 text-sm text-fg-muted">
            Can’t scan it? Enter this key instead:{" "}
            <code className="font-mono text-base text-fg-strong">{grouped}</code>
          </p>
        </li>
        <li>
          <FormField
            id="setup-code"
            label="Enter the 6-digit code the app shows"
            required
            requiredLabel="required"
            error={state.errors?.code}
          >
            {(p) => (
              <Input {...p} name="code" autoComplete="one-time-code" inputMode="numeric" maxLength={8} />
            )}
          </FormField>
        </li>
      </ol>
      <div>
        <Button type="submit" disabled={pending} aria-disabled={pending}>
          {pending ? "Checking…" : "Turn on two-step verification"}
        </Button>
      </div>
    </form>
  );
}
