import { render, screen, fireEvent } from "@testing-library/react";
import Link from "next/link";
import { Button } from "../Button";

describe("Button asChild", () => {
  it("merges styles onto a child link", () => {
    render(
      <Button asChild variant="secondary">
        <Link href="/pairs">Pairs</Link>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Pairs" });
    expect(link.className).toMatch(/border/);
    expect(link).toHaveAttribute("href", "/pairs");
  });

  it("renders a native button when asChild is false", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" }).tagName).toBe("BUTTON");
  });
});

describe("Button focus ring", () => {
  it("applies the token-driven focus-visible outline classes", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).toMatch(/focus-visible:outline\b/);
    expect(button.className).toMatch(/focus-visible:outline-2\b/);
    expect(button.className).toContain(
      "focus-visible:outline-offset-[var(--focus-ring-offset)]",
    );
    expect(button.className).toContain(
      "focus-visible:outline-[color:var(--focus-ring-color)]",
    );
  });

  it("does not hardcode a Tailwind color utility for the outline", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.className).not.toMatch(/focus-visible:outline-blue-\d+/);
  });

  it("carries the focus ring onto every variant", () => {
    (["primary", "secondary", "danger"] as const).forEach((variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole("button", { name: variant });
      expect(button.className).toContain(
        "focus-visible:outline-[color:var(--focus-ring-color)]",
      );
    });
  });

  it("keeps the focus ring on the merged child when asChild is used", () => {
    render(
      <Button asChild>
        <Link href="/pairs">Pairs</Link>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Pairs" });
    expect(link.className).toContain(
      "focus-visible:outline-[color:var(--focus-ring-color)]",
    );
  });
});
