import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { readChallenge } from "@/lib/auth/challenge";
import { totpUri } from "@/lib/auth/totp";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { AuthCard } from "../../AuthCard";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set up two-step verification" };

export default async function SetupPage() {
  const challenge = await readChallenge();
  if (!challenge) redirect("/admin/login?expired=1");
  if (!challenge.setup)
    return (
      <AuthCard title="Two-step verification is set up">
        <SetupForm secret={null} qrSvg={null} />
      </AuthCard>
    );
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, challenge.uid));
  if (!user) redirect("/admin/login?expired=1");
  const qrSvg = await QRCode.toString(totpUri(challenge.setup, user.email), {
    type: "svg",
    margin: 1,
    width: 220,
  });
  return (
    <AuthCard
      title="Set up two-step verification"
      lead="Every admin account needs it. Use an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password."
    >
      <SetupForm secret={challenge.setup} qrSvg={qrSvg} />
    </AuthCard>
  );
}
