// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Choice, ErrorSummary, FormField, Input } from "@/components/ui/Form";

afterEach(cleanup);

describe("FormField", () => {
  it("links label, hint and error to the control", () => {
    render(
      <FormField
        id="pan"
        label="PAN"
        hint="10 characters"
        error="Enter a valid PAN"
        required
        requiredLabel="required"
      >
        {(p) => <Input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText(/PAN/);
    expect(input.id).toBe("pan");
    expect(input.getAttribute("aria-describedby")).toBe("pan-error pan-hint");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hasAttribute("required")).toBe(true);
    expect(screen.getByText("Enter a valid PAN").closest("p")?.id).toBe("pan-error");
    expect(screen.getByText("(required)")).toBeTruthy();
  });

  it("has no aria-invalid or describedby when there is nothing to describe", () => {
    render(
      <FormField id="name" label="Name">
        {(p) => <Input {...p} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Name");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });
});

describe("Choice", () => {
  it("labels the checkbox and wires its hint and error", () => {
    render(
      <Choice id="citizen" label="I am an Indian citizen" hint="No FCRA" error="Please confirm" required />,
    );
    const box = screen.getByRole("checkbox", { name: "I am an Indian citizen" });
    expect(box.getAttribute("aria-describedby")).toBe("citizen-error citizen-hint");
    expect(box.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("ErrorSummary", () => {
  it("is an alert whose items link to their fields", () => {
    render(
      <ErrorSummary
        title="2 problems"
        errors={[
          { fieldId: "pan", message: "Bad PAN" },
          { fieldId: "email", message: "Bad email" },
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bad PAN" }).getAttribute("href")).toBe("#pan");
  });
  it("renders nothing without errors", () => {
    const { container } = render(<ErrorSummary title="x" errors={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
