import { render, screen, fireEvent } from "@testing-library/react";
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

  describe("disabled state", () => {
    it("renders as disabled when the disabled prop is passed", () => {
      render(
        <IconButton label="Delete item" disabled>
          ×
        </IconButton>,
      );
      expect(screen.getByRole("button", { name: "Delete item" })).toBeDisabled();
    });

    it("still exposes the accessible name while disabled", () => {
      render(
        <IconButton label="Delete item" disabled>
          ×
        </IconButton>,
      );
      expect(
        screen.getByRole("button", { name: "Delete item" }),
      ).toBeInTheDocument();
    });

    it("does not call the click handler when disabled", () => {
      const handleClick = jest.fn();
      render(
        <IconButton label="Delete item" disabled onClick={handleClick}>
          ×
        </IconButton>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("is not disabled by default", () => {
      render(<IconButton label="Delete item">×</IconButton>);
      expect(
        screen.getByRole("button", { name: "Delete item" }),
      ).not.toBeDisabled();
    });
  });

  describe("busy state", () => {
    // IconButton has no dedicated `busy` prop — it forwards ButtonHTMLAttributes
    // (including aria-busy) via ...rest, so "busy" is expressed through the
    // standard aria-busy attribute. These tests lock in that contract.
    it("forwards aria-busy to the rendered button when provided", () => {
      render(
        <IconButton label="Submitting" aria-busy="true">
          ×
        </IconButton>,
      );
      expect(
        screen.getByRole("button", { name: "Submitting" }),
      ).toHaveAttribute("aria-busy", "true");
    });

    it("does not set aria-busy when it is not provided", () => {
      render(<IconButton label="Submitting">×</IconButton>);
      expect(
        screen.getByRole("button", { name: "Submitting" }),
      ).not.toHaveAttribute("aria-busy");
    });

    it("still blocks clicks when both disabled and aria-busy are set", () => {
      const handleClick = jest.fn();
      render(
        <IconButton
          label="Submitting"
          disabled
          aria-busy="true"
          onClick={handleClick}
        >
          ×
        </IconButton>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Submitting" }));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("click handling (enabled)", () => {
    it("calls the click handler when enabled and clicked", () => {
      const handleClick = jest.fn();
      render(
        <IconButton label="Refresh" onClick={handleClick}>
          ×
        </IconButton>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});