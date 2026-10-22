"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Void receipt MSWT/2026-27/000123?">
        <p className="mb-6">The receipt number is kept and marked void. The donor is not emailed.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setOpen(false)}>Void receipt</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}
