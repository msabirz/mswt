import { expect, test, type Page } from "@playwright/test";

type Node = Record<string, unknown> & { "@type": string; "@id"?: string };

async function graphOf(page: Page): Promise<Node[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks).toHaveLength(1);
  const data = JSON.parse(blocks[0]!) as { "@context": string; "@graph": Node[] };
  expect(data["@context"]).toBe("https://schema.org");
  return data["@graph"];
}

for (const locale of ["en", "hi", "mr", "gu"]) {
  test(`/${locale} has one JSON-LD graph with NGO, WebSite and WebPage`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const graph = await graphOf(page);
    const byType = Object.fromEntries(graph.map((n) => [n["@type"], n]));
    expect(Object.keys(byType).sort()).toEqual(["NGO", "WebPage", "WebSite"]);
    expect(byType.WebPage!.inLanguage).toBe(locale);
    expect(byType.WebSite!.inLanguage).toBe(locale);
    expect(byType.WebPage!.publisher).toEqual({ "@id": byType.NGO!["@id"] });
    expect(JSON.stringify(graph)).not.toMatch(/SearchAction|FAQPage/);
  });
}

test("the NGO @id is identical in every language", async ({ page }) => {
  const seen = new Set<string>();
  for (const locale of ["en", "hi", "mr", "gu"]) {
    await page.goto(`/${locale}`);
    const ngo = (await graphOf(page)).find((n) => n["@type"] === "NGO");
    seen.add(ngo!["@id"]!);
  }
  expect(seen.size).toBe(1);
});

test("the JSON-LD logo is a crawlable 512×512 PNG", async ({ page, request }) => {
  await page.goto("/en");
  const ngo = (await graphOf(page)).find((n) => n["@type"] === "NGO")!;
  const url = new URL((ngo.logo as { url: string }).url);
  const res = await request.get(url.pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const buf = await res.body();
  expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([512, 512]);
});

test("the 404 page has no structured data", async ({ page }) => {
  await page.goto("/en/does-not-exist");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});
