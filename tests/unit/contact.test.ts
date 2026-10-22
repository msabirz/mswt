import { describe, expect, it, vi } from "vitest";
import { ContactSchema } from "@/lib/contact/schema";
import { clientIp, hashIp, isRateLimited, MAX_MESSAGES_PER_HOUR } from "@/lib/contact/rate-limit";
import { verifyTurnstile } from "@/lib/contact/turnstile";

const valid = {
  name: "Asha",
  email: "asha@example.com",
  phone: "",
  subject: "help",
  message: "Please call me back about help.",
};

describe("contact schema", () => {
  it("accepts a valid message and trims input", () => {
    expect(ContactSchema.parse({ ...valid, name: "  Asha  " }).name).toBe("Asha");
  });
  it.each([
    ["name", { name: "" }],
    ["email", { email: "asha@" }],
    ["phone", { phone: "abc" }],
    ["subject", { subject: "spam" }],
    ["message", { message: "short" }],
  ])("reports %s errors with the field's own code", (code, patch) => {
    const r = ContactSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path[0]).toBe(code);
  });
  it("allows an optional Indian phone number", () => {
    expect(ContactSchema.safeParse({ ...valid, phone: "+91 98765 43210" }).success).toBe(true);
  });
});

describe("rate limit and IP privacy", () => {
  it("limits after five messages an hour", () => {
    expect(isRateLimited(MAX_MESSAGES_PER_HOUR - 1)).toBe(false);
    expect(isRateLimited(MAX_MESSAGES_PER_HOUR)).toBe(true);
  });
  it("stores a salted hash, never the IP", () => {
    const h = hashIp("203.0.113.7", "salt");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).not.toContain("203.0.113.7");
    expect(hashIp("203.0.113.7", "other-salt")).not.toBe(h);
  });
  it("reads the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers())).toBeNull();
  });
});

describe("Turnstile verification", () => {
  it("passes only when Cloudflare says success", async () => {
    const ok = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    const bad = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false })));
    expect(await verifyTurnstile("token", "1.2.3.4", ok)).toBe(true);
    expect(await verifyTurnstile("token", null, bad)).toBe(false);
    const body = (ok.mock.calls[0]![1] as RequestInit).body as URLSearchParams;
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });
  it("fails closed without a token or on network errors", async () => {
    expect(await verifyTurnstile("", null, vi.fn())).toBe(false);
    expect(await verifyTurnstile("t", null, vi.fn().mockRejectedValue(new Error("down")))).toBe(false);
  });
});
