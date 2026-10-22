import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** ARIA attributes a control needs so its hint and error are announced with it. */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

export function describedBy(
  id: string,
  { hint, error }: { hint?: ReactNode; error?: ReactNode },
): string | undefined {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function fieldControlProps(
  id: string,
  opts: { hint?: ReactNode; error?: ReactNode; required?: boolean },
): FieldControlProps {
  return {
    id,
    "aria-describedby": describedBy(id, opts),
    ...(opts.error ? { "aria-invalid": true as const } : {}),
    ...(opts.required ? { required: true } : {}),
  };
}

const control =
  "w-full min-h-(--size-target-comfortable) rounded-sm border border-border-input bg-bg-canvas px-3 py-2 text-fg-default placeholder:text-fg-hint aria-invalid:border-2 aria-invalid:border-status-error-fg-on-canvas disabled:bg-bg-muted disabled:text-fg-disabled";

export function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="m-0 text-sm text-fg-hint">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="m-0 flex items-start gap-2 text-sm font-medium text-status-error-fg-on-canvas">
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * Label + hint + error + control, wired together by id.
 * The control receives `id`, `aria-describedby` (error first, then hint), `aria-invalid` and `required`.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  requiredLabel,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Visible "(required)"/"(optional)" text in the page language. */
  requiredLabel?: string;
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="font-semibold text-fg-strong">
        {label}
        {requiredLabel ? (
          <span className="ml-1 text-sm font-normal text-fg-muted">({requiredLabel})</span>
        ) : null}
      </label>
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      {children(fieldControlProps(id, { hint, error, required }))}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-32 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, className)} {...props} />;
}

/** Text input with a fixed prefix such as "₹". The prefix is decorative; the label says what it is. */
export function InputPrefix({
  prefix,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  return (
    <div className="flex items-stretch">
      <span
        aria-hidden="true"
        className="inline-flex items-center rounded-l-sm border border-r-0 border-border-input bg-bg-muted px-3 font-semibold"
      >
        {prefix}
      </span>
      <input className={cn(control, "rounded-l-none", className)} {...props} />
    </div>
  );
}

/** Checkbox or radio with its label and optional hint. */
export function Choice({
  id,
  type = "checkbox",
  label,
  hint,
  error,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  type?: "checkbox" | "radio";
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      <div className="flex min-h-(--size-target-min) items-start gap-3">
        <input
          type={type}
          {...props}
          {...fieldControlProps(id, { hint, error, required: props.required })}
          className="mt-1 size-5 flex-none accent-action-primary-bg"
        />
        <div className="grid gap-1">
          <label htmlFor={id}>{label}</label>
          {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
        </div>
      </div>
    </div>
  );
}

/** Group of radios or checkboxes with a visible legend. */
export function ChoiceGroup({
  legend,
  hint,
  error,
  id,
  children,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id: string;
  children: ReactNode;
}) {
  return (
    <fieldset
      className="m-0 grid min-w-0 gap-2 border-0 p-0"
      aria-describedby={describedBy(id, { hint, error })}
    >
      <legend className="mb-2 font-semibold text-fg-strong">{legend}</legend>
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      {children}
    </fieldset>
  );
}

/** Preset amounts as large radio cards (values are paise). */
export function AmountPicker({
  name,
  legend,
  options,
  defaultValue,
  id,
}: {
  name: string;
  legend: ReactNode;
  options: { value: number; label: string }[];
  defaultValue?: number;
  id: string;
}) {
  return (
    <ChoiceGroup legend={legend} id={id}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((o, i) => (
          <div key={o.value} className="relative">
            <input
              type="radio"
              id={`${id}-${i}`}
              name={name}
              value={o.value}
              defaultChecked={o.value === defaultValue}
              className="peer absolute inset-0 m-0 opacity-0"
            />
            <label
              htmlFor={`${id}-${i}`}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-border-input text-lg font-semibold text-fg-strong peer-checked:border-2 peer-checked:border-border-brand peer-checked:bg-bg-brand-subtle peer-checked:text-fg-brand peer-focus-visible:outline-(length:--border-width-focus) peer-focus-visible:outline-offset-(--size-focus-ring-offset) peer-focus-visible:outline-focus-ring peer-focus-visible:outline-solid"
            >
              {o.label}
            </label>
          </div>
        ))}
      </div>
    </ChoiceGroup>
  );
}

/** List of problems shown above a form after a failed submit; each item jumps to its field. */
export function ErrorSummary({
  title,
  errors,
  id = "error-summary",
}: {
  title: ReactNode;
  errors: { fieldId: string; message: ReactNode }[];
  id?: string;
}) {
  if (errors.length === 0) return null;
  return (
    <div
      id={id}
      role="alert"
      tabIndex={-1}
      className="grid grid-cols-[auto_1fr] gap-3 rounded-md border-l-4 border-status-error-icon bg-status-error-bg p-4 text-status-error-fg"
    >
      <span aria-hidden="true" className="font-semibold">
        !
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <ul className="mt-2 list-disc pl-5">
          {errors.map((e) => (
            <li key={e.fieldId}>
              <a href={`#${e.fieldId}`} className="text-inherit underline">
                {e.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
