import { forbidden, redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type AdminRole, type Capability } from "./permissions";

export type AdminSession = { id: string; name: string; email: string; role: AdminRole };

/** The signed-in admin, or a redirect to the login page. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/** Signed in and allowed, or login redirect / 403. Call at the top of every admin page and action. */
export async function requireCapability(...anyOf: Capability[]): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (!anyOf.some((c) => can(admin.role, c))) forbidden();
  return admin;
}
