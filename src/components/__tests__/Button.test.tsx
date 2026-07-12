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
