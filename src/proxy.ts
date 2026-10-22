import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { isCanonicalHost } from "./lib/seo/site";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intl(request);
  // Only the real domain may be indexed; *.vercel.app and preview hosts are always noindex (SEO-07).
  if (!isCanonicalHost(request.headers.get("host"))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Admin (English-only) and API routes are not locale-prefixed; skip Next internals and files.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
