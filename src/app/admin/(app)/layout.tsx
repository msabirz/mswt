import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/guard";
import { adminNav } from "@/lib/admin/nav";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "../(auth)/actions";

// Everything below requires a signed-in admin; each page also checks its own capability.
export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell
      nav={adminNav(admin.role)}
      account={
        <div className="grid gap-2 border-t border-neutral-700 pt-4 text-sm">
          <p className="m-0">
            <span className="block font-semibold text-fg-inverse">{admin.name}</span>
            {ROLE_LABELS[admin.role]}
          </p>
          <form action={logoutAction}>
            <Button type="submit" variant="on-brand">
              Sign out
            </Button>
          </form>
        </div>
      }
    >
      {children}
    </AdminShell>
  );
}
