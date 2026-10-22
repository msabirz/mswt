import { createTranslator } from "next-intl";
import tokens from "../../../../tokens/design-tokens.json";
import type { Locale } from "@/i18n/routing";
import { formatRupees, type Paise } from "@/lib/money";
import { appOrigin } from "@/lib/seo/site";

const C = {
  text: tokens.color.neutral["900"].$value,
  muted: tokens.color.neutral["700"].$value,
  rule: tokens.color.brand.green.$value,
  link: tokens.color.primary["700"].$value,
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Receipt email in the donor's language (the PDF itself is English; see src/lib/receipts/pdf.ts). */
export async function receiptEmail(
  locale: Locale,
  d: { name: string; amountPaise: Paise; receiptNumber: string; is80g: boolean; downloadUrl: string },
): Promise<{ subject: string; html: string; text: string }> {
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages, namespace: "ReceiptEmail" });
  const amount = formatRupees(d.amountPaise, locale);
  const v = { name: d.name, amount, number: d.receiptNumber };
  const subject = t(d.is80g ? "subject80g" : "subjectAck", v);
  const lines = [t("greeting", v), t("thanks", v), t(d.is80g ? "attached80g" : "attachedAck", v), t("link")];
  const text = [...lines, d.downloadUrl, "", t("signoff"), t("team")].join("\n\n");
  const p = (s: string) => `<p style="margin:0 0 16px">${esc(s)}</p>`;
  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;padding:24px;font-family:Poppins,Arial,sans-serif;font-size:15px;line-height:1.6;color:${C.text}">
<div style="max-width:560px;margin:0 auto">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>
<td style="padding-right:16px"><img src="${appOrigin()}/brand/mswt-logo-512.png" width="56" height="56" alt="MS Welfare Trust" style="display:block;border:0"></td>
<td style="font-weight:600;color:${C.text}">${esc(t("team"))}</td>
</tr></table>
<div style="border-top:4px solid ${C.rule};padding-top:20px">
${lines.map(p).join("\n")}
<p style="margin:0 0 24px"><a href="${esc(d.downloadUrl)}" style="color:${C.link}">${esc(d.receiptNumber)} (PDF)</a></p>
<p style="margin:0;color:${C.muted}">${esc(t("signoff"))}<br>${esc(t("team"))}</p>
</div></div></body></html>`;
  return { subject, html, text };
}
