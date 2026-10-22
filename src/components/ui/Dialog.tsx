"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Modal dialog built on native <dialog>: focus is trapped and Escape closes it.
 * Focus returns to the element that opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClose={() => {
        onClose();
        if (opener.current instanceof HTMLElement) opener.current.focus();
      }}
      className={cn(
        "m-auto w-full max-w-lg rounded-lg border border-border-decorative bg-bg-canvas p-6 text-fg-default shadow-md backdrop:bg-bg-inverse/60",
        className,
      )}
    >
      <h2 id="dialog-title" className="mb-4 text-xl">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
