import { headers } from "next/headers";
import { clientIp } from "@/lib/security/rate-limit";
import { requireCapability } from "./guard";
import type { Capability } from "./permissions";

/** The signed-in admin (checked for `capability`) and the audit actor for this request. */
export async function actorFor(capability: Capability) {
  const admin = await requireCapability(capability);
  const h = await headers();
  return { admin, actor: { userId: admin.id, ip: clientIp(h), userAgent: h.get("user-agent") } };
}
