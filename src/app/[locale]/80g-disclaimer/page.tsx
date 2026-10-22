import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { LegalPage, legalMetadata } from "@/components/content/LegalPage";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return legalMetadata("disclaimer_80g", "/80g-disclaimer", (await params).locale as Locale);
}

export default async function Disclaimer80gPage({ params }: Props) {
  return (
    <LegalPage pageKey="disclaimer_80g" path="/80g-disclaimer" locale={(await params).locale as Locale} />
  );
}
