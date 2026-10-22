import { can, type AdminRole, type Capability } from "./permissions";
import type { AdminNavItem } from "@/components/layout/AdminShell";

// Sidebar entries and who sees them. 8b/8c add donations, donors, reports, causes, content, messages.
const ITEMS: (AdminNavItem & { anyOf: Capability[] })[] = [
  { key: "home", label: "Home", href: "/admin", anyOf: ["dashboard.content"] },
  { key: "users", label: "Users", href: "/admin/users", anyOf: ["users.manage"] },
  {
    key: "org",
    label: "Organization",
    href: "/admin/settings/organization",
    anyOf: ["settings.organization"],
  },
  { key: "seo", label: "SEO", href: "/admin/settings/seo", anyOf: ["settings.seo"] },
  { key: "payments", label: "Payments", href: "/admin/settings/payments", anyOf: ["settings.payment"] },
  { key: "email", label: "Email", href: "/admin/settings/email", anyOf: ["settings.email"] },
  {
    key: "appearance",
    label: "Appearance",
    href: "/admin/settings/appearance",
    anyOf: ["settings.appearance"],
  },
  { key: "audit", label: "Audit log", href: "/admin/audit-log", anyOf: ["audit.read.all", "audit.read.own"] },
  { key: "account", label: "My account", href: "/admin/account", anyOf: ["dashboard.content"] },
];

export function adminNav(role: AdminRole): AdminNavItem[] {
  return ITEMS.filter((i) => i.anyOf.some((c) => can(role, c))).map(({ key, label, href }) => ({
    key,
    label,
    href,
  }));
}
