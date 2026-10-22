import { getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui/Alert";

/** Visible notice on pages showing sample content (previews only; never in production). */
export async function SampleBanner({ show }: { show: boolean }) {
  if (!show) return null;
  const t = await getTranslations("Common");
  return (
    <Alert tone="info" className="mb-8">
      <p>{t("sample")}</p>
    </Alert>
  );
}

/** Notice on content not yet reviewed by the Trust (only visible outside production). */
export async function DraftBanner({ show }: { show: boolean }) {
  if (!show) return null;
  const t = await getTranslations("Common");
  return (
    <Alert tone="warning" className="mb-8">
      <p>{t("draft")}</p>
    </Alert>
  );
}
