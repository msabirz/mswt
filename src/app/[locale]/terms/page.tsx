import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { LegalPage, legalMetadata } from "@/components/content/LegalPage";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return legalMetadata("terms", "/terms", (await params).locale as Locale);
}

export default async function TermsPage({ params }: Props) {
  return <LegalPage pageKey="terms" path="/terms" locale={(await params).locale as Locale} />;
}
