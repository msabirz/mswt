import type { Metadata } from "next";
import { requireCapability } from "@/lib/admin/guard";
import { adminNav } from "@/lib/admin/nav";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { TextLink } from "@/components/ui/TextLink";

export const metadata: Metadata = { title: "Home" };

export default async function AdminHome() {
  const admin = await requireCapability("dashboard.content");
  const links = adminNav(admin.role).filter((i) => i.key !== "home");
  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-3xl">Welcome, {admin.name}</h1>
      <p>
        You are signed in as <strong>{ROLE_LABELS[admin.role]}</strong>. The dashboard with donation figures
        arrives in the next update; for now, these are the parts of the admin you can use:
      </p>
      <ul className="grid gap-2">
        {links.map((l) => (
          <li key={l.key}>
            <TextLink href={l.href}>{l.label}</TextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
