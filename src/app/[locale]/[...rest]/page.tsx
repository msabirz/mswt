import { notFound } from "next/navigation";

// Any path under a locale that no other route matches is a real 404 (SEO-14).
export default function CatchAll(): never {
  notFound();
}
