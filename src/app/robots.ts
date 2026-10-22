import type { MetadataRoute } from "next";
import { crawlAllowed, siteUrl } from "@/lib/seo/site";

export function robotsFor(vercelEnv: string | undefined): MetadataRoute.Robots {
  if (!crawlAllowed(vercelEnv)) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
    host: siteUrl().origin,
  };
}

export default function robots(): MetadataRoute.Robots {
  return robotsFor(process.env.VERCEL_ENV);
}
