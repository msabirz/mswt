import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Admin (English-only) and API routes are not locale-prefixed; skip Next internals and files.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
