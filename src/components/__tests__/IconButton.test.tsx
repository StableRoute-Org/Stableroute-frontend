import { render, screen } from "@testing-library/react";
import { IconButton } from "../IconButton";

describe("IconButton", () => {
  it("renders children and exposes the required accessible name", () => {
    render(<IconButton label="Close">×</IconButton>);
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Close");
  });

  it("merges extra className without dropping the base styles", () => {
    render(
      <IconButton label="Close" className="extra-class">
        ×
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button.className).toMatch(/extra-class/);
    expect(button.className).toMatch(/rounded-full/);
  });

  it("applies the token-driven focus-visible outline classes", () => {
    render(<IconButton label="Close">×</IconButton>);
    const button = screen.getByRole("button", { name: "Close" });
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
    render(<IconButton label="Close">×</IconButton>);
    const button = screen.getByRole("button", { name: "Close" });
    expect(button.className).not.toMatch(/focus-visible:outline-blue-\d+/);
  });
});
