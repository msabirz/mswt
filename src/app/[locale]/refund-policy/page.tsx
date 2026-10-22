import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { LegalPage, legalMetadata } from "@/components/content/LegalPage";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return legalMetadata("refund_policy", "/refund-policy", (await params).locale as Locale);
}

export default async function RefundPage({ params }: Props) {
  return <LegalPage pageKey="refund_policy" path="/refund-policy" locale={(await params).locale as Locale} />;
}
