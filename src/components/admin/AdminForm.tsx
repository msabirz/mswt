"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Choice, ErrorSummary, FormField, Input, Select, Textarea } from "@/components/ui/Form";
import type { FieldSpec, FormState } from "./form-state";

const fieldId = (form: string, name: string) => `${form}-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

/**
 * Generic admin form: fields from a spec, posted to a Server Action that validates on the server.
 * Errors appear next to each field and in a focused summary (A11Y-05); success is announced.
 */
export function AdminForm({
  id,
  action,
  fields,
  submitLabel,
  pendingLabel = "Saving…",
  hidden,
  confirm,
}: {
  id: string;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  fields: FieldSpec[];
  submitLabel: string;
  pendingLabel?: string;
  hidden?: Record<string, string>;
  /** Ask before submitting (destructive actions). */
  confirm?: string;
}) {
  const [state, run, pending] = useActionState(action, { status: "idle" } as FormState);
  const status = useRef<HTMLDivElement>(null);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  useEffect(() => {
    if (state.status === "error") document.getElementById(`${id}-summary`)?.focus();
    if (state.status === "saved") status.current?.focus();
  }, [state, id]);

  const summary = Object.entries(errors).map(([name, message]) => ({
    fieldId: name === "form" ? `${id}-submit` : fieldId(id, name),
    message,
  }));
  const groups: FieldSpec[][] = [];
  for (const f of fields) {
    const last = groups.at(-1);
    if (f.group && last?.[0]?.group === f.group) last.push(f);
    else groups.push([f]);
  }

  return (
    <form
      action={run}
      className="grid gap-6"
      noValidate
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {hidden
        ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      {summary.length > 0 ? (
        <ErrorSummary
          id={`${id}-summary`}
          title={state.message ?? "Please fix the following:"}
          errors={summary}
        />
      ) : null}
      <div ref={status} tabIndex={-1} className="empty:hidden">
        {state.status === "saved" ? (
          <Alert tone="success" live="polite">
            <p>{state.message ?? "Saved."}</p>
          </Alert>
        ) : null}
      </div>
      {groups.map((group) => (
        <div
          key={group.map((f) => f.name).join("|")}
          className={group.length > 1 ? "grid gap-6 md:grid-cols-2 lg:grid-cols-4" : "grid gap-6"}
        >
          {group.map((f) => {
            const fid = fieldId(id, f.name);
            const value = values[f.name] ?? f.defaultValue ?? "";
            if (f.type === "checkbox")
              return (
                <Choice
                  key={f.name}
                  id={fid}
                  name={f.name}
                  label={f.label}
                  hint={f.hint}
                  error={errors[f.name]}
                  defaultChecked={value === "on" || value === "true"}
                />
              );
            return (
              <FormField
                key={f.name}
                id={fid}
                label={f.label}
                hint={f.hint}
                error={errors[f.name]}
                required={f.required}
                requiredLabel={f.required ? "required" : undefined}
              >
                {(p) =>
                  f.type === "textarea" ? (
                    <Textarea
                      {...p}
                      name={f.name}
                      defaultValue={value}
                      rows={f.rows ?? 4}
                      lang={f.lang}
                      maxLength={f.maxLength}
                      readOnly={f.readOnly}
                    />
                  ) : f.type === "select" ? (
                    <Select {...p} name={f.name} defaultValue={value}>
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      {...p}
                      name={f.name}
                      type={f.type ?? "text"}
                      defaultValue={f.type === "password" ? undefined : value}
                      autoComplete={f.autoComplete}
                      inputMode={f.inputMode}
                      lang={f.lang}
                      maxLength={f.maxLength}
                      readOnly={f.readOnly}
                    />
                  )
                }
              </FormField>
            );
          })}
        </div>
      ))}
      <div>
        <Button id={`${id}-submit`} type="submit" disabled={pending} aria-disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
