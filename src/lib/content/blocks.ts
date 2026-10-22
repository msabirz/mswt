import { z } from "zod";

/**
 * Rich text is stored as typed blocks (never raw HTML), so content can't inject markup and the
 * admin editor (Step 8) can validate it. Inline text supports **bold** and [label](https://… or /path).
 */
export const BlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(1),
  }),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean().optional(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({ type: z.literal("callout"), tone: z.enum(["info", "warning"]), text: z.string().min(1) }),
]);
export const BlocksSchema = z.array(BlockSchema);

export type Block = z.infer<typeof BlockSchema>;
export type Blocks = Block[];

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string };

/** Only site-relative paths, https URLs and mailto/tel links are allowed in content. */
export function safeHref(href: string): string | null {
  if (/^\/(?!\/)/.test(href)) return href;
  if (/^https:\/\/[^\s]+$/i.test(href)) return href;
  if (/^(mailto|tel):[^\s]+$/i.test(href)) return href;
  return null;
}

/** Split inline markup into plain text, **bold** and [links](href). Unsafe links become plain text. */
export function parseInline(input: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of input.matchAll(re)) {
    if (m.index > last) out.push({ kind: "text", text: input.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: "bold", text: m[1] });
    else {
      const href = safeHref(m[3]!);
      out.push(href ? { kind: "link", text: m[2]!, href } : { kind: "text", text: m[2]! });
    }
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ kind: "text", text: input.slice(last) });
  return out;
}
