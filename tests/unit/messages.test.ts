import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import gu from "@/messages/gu.json";
import hi from "@/messages/hi.json";
import mr from "@/messages/mr.json";

// I18N-02: every UI string exists in all four languages, with the same {placeholders}.
function flatten(obj: unknown, prefix = ""): Record<string, string> {
  if (typeof obj === "string") return { [prefix]: obj };
  return Object.entries(obj as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }),
    {},
  );
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const base = flatten(en);
describe.each([
  ["hi", hi],
  ["mr", mr],
  ["gu", gu],
])("messages/%s.json", (_locale, messages) => {
  const other = flatten(messages);
  it("has exactly the English keys", () => {
    expect(Object.keys(other).sort()).toEqual(Object.keys(base).sort());
  });
  it("has no empty strings and keeps every placeholder", () => {
    for (const [key, value] of Object.entries(other)) {
      expect(value.trim(), key).not.toBe("");
      expect(placeholders(value), key).toEqual(placeholders(base[key] ?? ""));
    }
  });
});
