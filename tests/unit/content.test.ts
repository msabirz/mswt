import { describe, expect, it } from "vitest";
import { parseInline, safeHref } from "@/lib/content/blocks";
import { ContentFileSchema } from "@/lib/content/format";
import {
  availableLocales,
  causesFrom,
  eventsFrom,
  newsFrom,
  pageFrom,
  splitEvents,
  visible,
} from "@/lib/content/queries";
import { mergeContent, type SiteContent } from "@/lib/content/source";

const file = (raw: unknown): SiteContent => ({ ...ContentFileSchema.parse(raw), sampleParts: [] });

describe("language and review rule", () => {
  const tr = { en: { reviewed: true }, hi: { reviewed: false } };
  it("shows a translation only in its own language", () => {
    expect(visible(tr, "en", true)).not.toBeNull();
    expect(visible(tr, "mr", false)).toBeNull();
  });
  it("hides unreviewed translations in production only", () => {
    expect(visible(tr, "hi", true)).toBeNull();
    expect(visible(tr, "hi", false)).not.toBeNull();
    expect(availableLocales(tr, true)).toEqual(["en"]);
    expect(availableLocales(tr, false)).toEqual(["en", "hi"]);
  });
});

describe("views", () => {
  const c = file({
    causes: [
      { slug: "a", status: "active", translations: { en: { title: "A", summary: "s" } } },
      { slug: "b", status: "draft", translations: { en: { title: "B", summary: "s" } } },
      { slug: "c", status: "closed", translations: { hi: { title: "C", summary: "s" } } },
    ],
    news: [
      {
        slug: "old",
        status: "published",
        publishedAt: "2026-01-01T10:00:00+05:30",
        translations: { en: { headline: "Old", excerpt: "e" } },
      },
      {
        slug: "new",
        status: "published",
        publishedAt: "2026-06-01T10:00:00+05:30",
        translations: { en: { headline: "New", excerpt: "e" } },
      },
      {
        slug: "draft",
        status: "draft",
        publishedAt: "2026-07-01T10:00:00+05:30",
        translations: { en: { headline: "D", excerpt: "e" } },
      },
    ],
    events: [
      {
        slug: "past",
        status: "published",
        startsAt: "2026-01-10T10:00:00+05:30",
        translations: { en: { title: "P", summary: "s" } },
      },
      {
        slug: "next",
        status: "published",
        startsAt: "2027-01-10T10:00:00+05:30",
        translations: { en: { title: "N", summary: "s" } },
      },
    ],
    pages: { about: { en: { title: "About", h1: "About us", sections: [] } } },
  });

  it("drops draft causes and items without the language", () => {
    expect(causesFrom(c, "en").map((x) => x.slug)).toEqual(["a"]);
    expect(causesFrom(c, "hi").map((x) => x.slug)).toEqual(["c"]);
  });
  it("lists published news newest first", () => {
    expect(newsFrom(c, "en").map((x) => x.slug)).toEqual(["new", "old"]);
  });
  it("splits events into upcoming and past around now", () => {
    const { upcoming, past } = splitEvents(eventsFrom(c, "en"), new Date("2026-10-22T00:00:00Z"));
    expect(upcoming.map((e) => e.slug)).toEqual(["next"]);
    expect(past.map((e) => e.slug)).toEqual(["past"]);
  });
  it("finds pages per language", () => {
    expect(pageFrom(c, "about", "en")?.h1).toBe("About us");
    expect(pageFrom(c, "about", "gu")).toBeNull();
    expect(pageFrom(c, "privacy", "en")).toBeNull();
  });
});

describe("mergeContent", () => {
  it("fills empty parts from the fallback and records them as sample", () => {
    const db = file({
      causes: [{ slug: "real", status: "active", translations: { en: { title: "R", summary: "s" } } }],
    });
    const sample = file({
      causes: [{ slug: "sample", status: "active", translations: { en: { title: "S", summary: "s" } } }],
      news: [
        {
          slug: "n",
          status: "published",
          publishedAt: "2026-01-01T10:00:00+05:30",
          translations: { en: { headline: "H", excerpt: "e" } },
        },
      ],
      pages: { about: { en: { title: "A", h1: "A", sections: [] } } },
    });
    const merged = mergeContent(db, sample);
    expect(merged.causes.map((x) => x.slug)).toEqual(["real"]);
    expect(merged.news).toHaveLength(1);
    expect(merged.sampleParts.sort()).toEqual(["news", "page:about"]);
  });
});

describe("inline content markup", () => {
  it("parses bold and links", () => {
    expect(parseInline("Read **this** and [our policy](/en/privacy).")).toEqual([
      { kind: "text", text: "Read " },
      { kind: "bold", text: "this" },
      { kind: "text", text: " and " },
      { kind: "link", text: "our policy", href: "/en/privacy" },
      { kind: "text", text: "." },
    ]);
  });
  it("turns unsafe links into plain text", () => {
    expect(parseInline("[x](javascript:alert(1))")).toEqual([
      { kind: "text", text: "x" },
      { kind: "text", text: ")" },
    ]);
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("http://insecure.example")).toBeNull();
    expect(safeHref("https://ok.example/a")).toBe("https://ok.example/a");
    expect(safeHref("mailto:info@mswelfaretrust.org")).toBe("mailto:info@mswelfaretrust.org");
  });
  it("rejects HTML-looking content as data, never markup", () => {
    expect(parseInline("<script>alert(1)</script>")).toEqual([
      { kind: "text", text: "<script>alert(1)</script>" },
    ]);
  });
});

describe("content files", () => {
  it("the committed sample and real content files are valid", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["data/sample/content.json", "data/content/content.json"]) {
      expect(() => ContentFileSchema.parse(JSON.parse(readFileSync(f, "utf8")))).not.toThrow();
    }
  });
});
