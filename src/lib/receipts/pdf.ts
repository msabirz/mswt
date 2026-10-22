import { readFileSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import tokens from "../../../tokens/design-tokens.json";
import type { PostalAddress } from "@/lib/db/schema";
import { formatRupees, type Paise } from "@/lib/money";
import type { ReceiptKind } from "./numbering";
import { amountInWords } from "./words";

// Receipt PDF (spec §4.3), English only (owner decision 2026-10-22). Donor names and addresses may
// be in Devanagari or Gujarati: Poppins covers Latin + Devanagari, Noto Sans Gujarati the rest.
// TTF, not WOFF2: pdfkit's font subsetter breaks with two WOFF2 fonts in one document.

const asset = (file: string) => join(process.cwd(), "src/assets/receipt", file);
const FONTS = {
  regular: asset("Poppins_400Regular.ttf"),
  bold: asset("Poppins_600SemiBold.ttf"),
  gujarati: asset("NotoSansGujarati_400Regular.ttf"),
  gujaratiBold: asset("NotoSansGujarati_600SemiBold.ttf"),
};
const COLOR = {
  text: tokens.color.neutral["900"].$value,
  muted: tokens.color.neutral["700"].$value,
  rule: tokens.color.brand.green.$value,
  line: tokens.color.neutral["200"].$value,
  void: tokens.color.error["700"].$value,
};

export type TrustFacts = {
  legalName: string;
  address: string | null;
  email: string | null;
  website: string;
  trustPan: string | null;
  reg12aNumber: string | null;
  reg80gNumber: string | null;
  reg80gValidFrom: string | null;
  reg80gValidTo: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
};

export type ReceiptData = {
  kind: ReceiptKind;
  number: string;
  receivedAt: Date;
  donorName: string;
  donorAddress: PostalAddress | null;
  panMasked: string | null;
  amountPaise: Paise;
  modeLabel: string;
  paymentReference: string | null;
  towards: string;
  ackReason: "no_pan" | "not_requested" | "cause" | "cash_limit" | null;
  voided?: boolean;
  trust: TrustFacts;
};

/** Trust facts a receipt cannot be issued without (open-questions B1, B8). */
export function missingTrustFacts(t: TrustFacts, kind: ReceiptKind): string[] {
  const missing: string[] = [];
  if (!t.address) missing.push("Trust address");
  if (!t.trustPan) missing.push("Trust PAN");
  if (!t.signatoryName) missing.push("signatory name");
  if (kind === "80g") {
    if (!t.reg80gNumber) missing.push("80G registration number");
    if (!t.reg80gValidFrom || !t.reg80gValidTo) missing.push("80G validity");
  }
  return missing;
}

const TBC = (what: string) => `[to be confirmed: ${what}]`;

function istDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

const GUJARATI = /[઀-૿]+/g;

/** Splits text into runs so Gujarati uses Noto Sans Gujarati and everything else Poppins. */
function runs(text: string): { gujarati: boolean; text: string }[] {
  const out: { gujarati: boolean; text: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(GUJARATI)) {
    if (m.index > last) out.push({ gujarati: false, text: text.slice(last, m.index) });
    out.push({ gujarati: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ gujarati: false, text: text.slice(last) });
  return out;
}

type Doc = PDFKit.PDFDocument;

function mixed(doc: Doc, text: string, bold: boolean, opts: PDFKit.Mixins.TextOptions = {}) {
  const parts = runs(text);
  parts.forEach((part, i) => {
    doc.font(part.gujarati ? (bold ? "gujaratiBold" : "gujarati") : bold ? "bold" : "regular");
    doc.text(part.text, { ...opts, continued: i < parts.length - 1 });
  });
}

/** Draws the horizontal logo from its SVG (nested <g transform> + <path d>, as in brand/logo). */
function drawLogo(doc: Doc, x: number, y: number, width: number) {
  const svg = readFileSync(join(process.cwd(), "public/brand/mswt-logo-horizontal.svg"), "utf8");
  const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const vbWidth = Number(viewBox?.[1] ?? 1560);
  doc
    .save()
    .translate(x, y)
    .scale(width / vbWidth);
  const fills: string[] = [];
  for (const tag of svg.matchAll(/<(\/?)(g|path)\b([^>]*?)(\/?)>/g)) {
    const [, closing, name, attrs = ""] = tag;
    if (name === "g" && closing) {
      doc.restore();
      fills.pop();
      continue;
    }
    if (name === "g") {
      doc.save();
      fills.push(/fill="([^"]+)"/.exec(attrs)?.[1] ?? fills.at(-1) ?? COLOR.text);
      const transform = /transform="([^"]+)"/.exec(attrs)?.[1] ?? "";
      for (const [, fn, args] of transform.matchAll(/(translate|scale)\(([^)]*)\)/g)) {
        const [a = 0, b] = (args ?? "").split(/[\s,]+/).map(Number);
        if (fn === "translate") doc.translate(a, b ?? 0);
        else doc.scale(a, b ?? a);
      }
      continue;
    }
    const d = /\bd="([^"]+)"/.exec(attrs)?.[1];
    if (d) doc.path(d).fill(fills.at(-1) ?? COLOR.text);
  }
  doc.restore();
}

function ackNote(reason: ReceiptData["ackReason"]): string {
  switch (reason) {
    case "cash_limit":
      return "This is an acknowledgement, not a receipt for deduction under Section 80G: donations in cash above ₹2,000 are not eligible for the deduction (Section 80G(5D) of the Income-tax Act, 1961).";
    case "no_pan":
      return "This is an acknowledgement, not a receipt for deduction under Section 80G, because no PAN was provided. Contact the Trust in the same financial year to have an 80G receipt issued.";
    case "cause":
      return "This is an acknowledgement. Donations towards this purpose are not eligible for deduction under Section 80G.";
    default:
      return "This is an acknowledgement of your donation. It is not a receipt for deduction under Section 80G.";
  }
}

/** Renders the receipt to a PDF buffer. */
export async function renderReceiptPdf(r: ReceiptData): Promise<Buffer> {
  // `font` avoids pdfkit loading its built-in Helvetica metrics (not shipped to serverless bundles).
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    font: FONTS.regular,
    info: {
      Title: `${r.kind === "80g" ? "Donation receipt" : "Acknowledgement"} ${r.number}`,
      Author: r.trust.legalName,
      Subject: "Donation receipt",
    },
  });
  for (const [name, path] of Object.entries(FONTS)) doc.registerFont(name, path);
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const t = r.trust;

  // Header: logo left, title + number right.
  drawLogo(doc, left, 48, 190);
  doc.fillColor(COLOR.text).font("bold").fontSize(15);
  doc.text(r.kind === "80g" ? "DONATION RECEIPT" : "ACKNOWLEDGEMENT", left, 52, { width, align: "right" });
  doc.font("regular").fontSize(9.5).fillColor(COLOR.muted);
  doc.text(`No. ${r.number}`, { width, align: "right" });
  doc.text(`Date: ${istDate(r.receivedAt)}`, { width, align: "right" });

  // Trust block.
  doc.y = 118;
  doc.font("bold").fontSize(11).fillColor(COLOR.text).text(t.legalName, left, doc.y, { width });
  doc.font("regular").fontSize(8.5).fillColor(COLOR.muted);
  doc.text(t.address ?? TBC("Trust address"), { width });
  const regs = [
    `PAN: ${t.trustPan ?? TBC("Trust PAN")}`,
    `12A: ${t.reg12aNumber ?? TBC("12A registration")}`,
    `80G: ${t.reg80gNumber ?? TBC("80G registration")}` +
      (t.reg80gValidFrom && t.reg80gValidTo ? ` (valid ${t.reg80gValidFrom} to ${t.reg80gValidTo})` : ""),
  ];
  doc.text(regs.join("   ·   "), { width });
  doc.moveDown(0.6);
  doc.rect(left, doc.y, width, 2).fill(COLOR.rule);
  doc.moveDown(1);

  // Details table.
  const address = r.donorAddress
    ? [
        r.donorAddress.line1,
        r.donorAddress.line2,
        r.donorAddress.city,
        `${r.donorAddress.state} ${r.donorAddress.pincode}`,
      ]
        .filter(Boolean)
        .join(", ")
    : null;
  const rows: [string, string][] = [
    ["Received with thanks from", r.donorName],
    ...(address ? ([["Address", address]] as [string, string][]) : []),
    ...(r.panMasked ? ([["Donor PAN", r.panMasked]] as [string, string][]) : []),
    ["Amount", formatRupees(r.amountPaise, "en")],
    ["Amount in words", amountInWords(r.amountPaise)],
    ["Mode of payment", r.modeLabel],
    ...(r.paymentReference ? ([["Payment reference", r.paymentReference]] as [string, string][]) : []),
    ["Towards", r.towards],
    ["Date of receipt", istDate(r.receivedAt)],
  ];
  const labelWidth = 150;
  for (const [label, value] of rows) {
    const y = doc.y;
    doc.font("regular").fontSize(9.5).fillColor(COLOR.muted).text(label, left, y, { width: labelWidth });
    doc.fillColor(COLOR.text);
    doc.x = left + labelWidth;
    doc.y = y;
    mixed(doc, value, true, { width: width - labelWidth });
    doc.x = left;
    doc.moveDown(0.25);
    doc
      .moveTo(left, doc.y)
      .lineTo(left + width, doc.y)
      .lineWidth(0.5)
      .strokeColor(COLOR.line)
      .stroke();
    doc.moveDown(0.45);
  }

  // Statement.
  doc.moveDown(0.6);
  doc.font("regular").fontSize(9).fillColor(COLOR.text);
  doc.text(
    r.kind === "80g"
      ? "This donation is eligible for deduction under Section 80G of the Income-tax Act, 1961, subject to the conditions specified therein. The Trust reports donations in Form 10BD; the certificate in Form 10BE is issued after that filing."
      : ackNote(r.ackReason),
    left,
    doc.y,
    { width },
  );
  doc.moveDown(0.5);
  doc.text("We confirm that no goods or services were provided in return for this donation.", { width });

  // Signatory.
  doc.moveDown(2.5);
  doc.font("bold").fontSize(9.5).text(`For ${t.legalName}`, { width, align: "right" });
  doc.moveDown(1.8);
  doc
    .font("regular")
    .fontSize(9)
    .text(t.signatoryName ?? TBC("signatory"), { width, align: "right" });
  doc.fillColor(COLOR.muted).text(t.signatoryTitle ?? "Authorised Signatory", { width, align: "right" });

  // Footer.
  const footerY = doc.page.height - doc.page.margins.bottom - 24;
  doc.fontSize(7.5).fillColor(COLOR.muted);
  doc.text(
    `This is a computer-generated receipt. ${[t.website, t.email].filter(Boolean).join("  ·  ")}`,
    left,
    footerY,
    { width, align: "center", lineBreak: false },
  );

  if (r.voided) {
    doc.save().rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.font("bold").fontSize(110).fillColor(COLOR.void).opacity(0.18);
    doc.text("VOID", 0, doc.page.height / 2 - 70, {
      width: doc.page.width,
      align: "center",
      lineBreak: false,
    });
    doc.restore();
  }

  doc.end();
  return done;
}
