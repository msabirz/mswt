import { describe, expect, it } from "vitest";
import { MAIN_NAV, PAGES, pageHref, readyPages, switchLocaleHref } from "@/config/nav";
import { styleguideEnabled } from "@/lib/flags";

describe("nav config", () => {
  it("only lists pages that are ready", () => {
    const ready = readyPages(MAIN_NAV);
    expect(ready.every((k) => PAGES[k].ready)).toBe(true);
  });
  it("builds locale-prefixed hrefs", () => {
    expect(pageHref("hi", "home")).toBe("/hi");
    expect(pageHref("gu", "donate")).toBe("/gu/donate");
  });
});

describe("switchLocaleHref", () => {
  it("keeps the rest of the path", () => {
    expect(switchLocaleHref("/en/causes/education", "mr")).toBe("/mr/causes/education");
    expect(switchLocaleHref("/hi", "en")).toBe("/en");
  });
  it("falls back to the locale home for paths without a locale", () => {
    expect(switchLocaleHref("/", "gu")).toBe("/gu");
    expect(switchLocaleHref("/admin", "hi")).toBe("/hi");
  });
});

describe("styleguideEnabled", () => {
  it("is off only in production", () => {
    expect(styleguideEnabled("production")).toBe(false);
    expect(styleguideEnabled("preview")).toBe(true);
    expect(styleguideEnabled(undefined)).toBe(true);
  });
});
