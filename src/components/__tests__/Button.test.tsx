import { render, screen } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders the primary variant by default", () => {
    render(<Button>Save route</Button>);

    expect(screen.getByRole("button", { name: /save route/i }).className).toMatch(
      /bg-black/
    );
  });

  it("applies each supported variant", () => {
    render(
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </>
    );

    expect(screen.getByRole("button", { name: /cancel/i }).className).toMatch(
      /border-neutral-300/
    );
    expect(screen.getByRole("button", { name: /delete/i }).className).toMatch(
      /bg-rose-600/
    );
  });

  it("supports disabled state and forwards arbitrary props", () => {
    render(
      <Button
        aria-label="Submit route"
        className="tracking-wide"
        data-testid="route-button"
        disabled
        type="submit"
      />
    );

    const button = screen.getByTestId("route-button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "Submit route");
    expect(button).toHaveAttribute("type", "submit");
    expect(button.className).toMatch(/tracking-wide/);
  });
});
