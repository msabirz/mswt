// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Logo, logoSize } from "@/components/ui/Logo";

afterEach(cleanup);

describe("Button / ButtonLink", () => {
  it("Button is a type=button by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" }).getAttribute("type")).toBe("button");
  });
  it("ButtonLink is a link", () => {
    render(<ButtonLink href="/en/donate">Donate</ButtonLink>);
    expect(screen.getByRole("link", { name: "Donate" }).getAttribute("href")).toBe("/en/donate");
  });
});

describe("Alert", () => {
  it("is announced only when live", () => {
    const { rerender } = render(<Alert tone="info" title="Note" />);
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<Alert tone="info" title="Confirming" live="polite" />);
    expect(screen.getByRole("status")).toBeTruthy();
    rerender(<Alert tone="error" title="Failed" live="assertive" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

describe("Breadcrumbs", () => {
  it("marks the last item as the current page without a link", () => {
    render(<Breadcrumbs label="Breadcrumb" items={[{ label: "Home", href: "/en" }, { label: "Causes" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
    expect(screen.getByText("Causes").getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: "Causes" })).toBeNull();
  });
});

describe("Logo", () => {
  it("never renders below the brand minimum width", () => {
    expect(logoSize("horizontal", 120).width).toBe(200);
    expect(logoSize("mark", 20).width).toBe(48);
    expect(logoSize("compact", 16)).toEqual({ width: 16, height: 16 });
  });
  it("has the given accessible name", () => {
    render(<Logo alt="MS Welfare Trust – home" />);
    expect(screen.getByRole("img", { name: "MS Welfare Trust – home" }).getAttribute("width")).toBe("204");
  });
});
