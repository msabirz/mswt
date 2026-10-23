import { can, type AdminRole, type Capability } from "./permissions";
import type { AdminNavGroup } from "@/components/layout/AdminShell";

// Sidebar, grouped. Each entry is shown only to roles with one of its capabilities; pages check again.
// 8c adds Causes, Content and Messages.
type Item = { key: string; label: string; href: string; icon: string; anyOf: Capability[] };
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { key: "home", label: "Dashboard", href: "/admin", icon: "dashboard", anyOf: ["dashboard.content"] },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        key: "donations",
        label: "Donations",
        href: "/admin/donations",
        icon: "donations",
        anyOf: ["donations.view"],
      },
      { key: "donors", label: "Donors", href: "/admin/donors", icon: "donors", anyOf: ["donations.view"] },
      {
        key: "reports",
        label: "Reports",
        href: "/admin/reports",
        icon: "reports",
        anyOf: ["reports.export"],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        key: "org",
        label: "Organization",
        href: "/admin/settings/organization",
        icon: "organization",
        anyOf: ["settings.organization"],
      },
      { key: "seo", label: "SEO", href: "/admin/settings/seo", icon: "seo", anyOf: ["settings.seo"] },
      {
        key: "payments",
        label: "Payments",
        href: "/admin/settings/payments",
        icon: "payments",
        anyOf: ["settings.payment"],
      },
      {
        key: "email",
        label: "Email",
        href: "/admin/settings/email",
        icon: "email",
        anyOf: ["settings.email"],
      },
      {
        key: "appearance",
        label: "Appearance",
        href: "/admin/settings/appearance",
        icon: "appearance",
        anyOf: ["settings.appearance"],
      },
    ],
  },
  {
    label: "Admin",
    items: [
      { key: "users", label: "Users", href: "/admin/users", icon: "users", anyOf: ["users.manage"] },
      {
        key: "audit",
        label: "Audit log",
        href: "/admin/audit-log",
        icon: "audit",
        anyOf: ["audit.read.all", "audit.read.own"],
      },
      {
        key: "account",
        label: "My account",
        href: "/admin/account",
        icon: "account",
        anyOf: ["dashboard.content"],
      },
    ],
  },
];

export function adminNav(role: AdminRole): AdminNavGroup[] {
  return GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter((i) => i.anyOf.some((c) => can(role, c))).map(({ anyOf: _, ...i }) => i),
  })).filter((g) => g.items.length > 0);
}

/** Flat list of what a role can open (admin home "quick links", tests). */
export const adminNavItems = (role: AdminRole) => adminNav(role).flatMap((g) => g.items);
