import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card", () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it("renders title and body", () => {
    render(<Card title="t-title">body-text</Card>);
    expect(screen.getByText(/t-title/)).toBeInTheDocument();
    expect(screen.getByText(/body-text/)).toBeInTheDocument();
  });

  it("renders the footer when provided", () => {
    render(
      <Card title="t" footer={<span>foot</span>}>
        body
      </Card>
    );
    expect(screen.getByText(/foot/)).toBeInTheDocument();
  });

  it("does not render title element when title is omitted", () => {
    render(<Card>just body</Card>);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.getByText("just body")).toBeInTheDocument();
  });

  it("does not render footer element when footer is omitted", () => {
    const { container } = render(<Card title="t">body</Card>);
    // There should be no <footer> in the DOM
    expect(container.querySelector("footer")).not.toBeInTheDocument();
  });

  it("forwards extra HTML attributes to the root section", () => {
    render(
      <Card id="my-card" aria-label="info card">
        content
      </Card>
    );
    const section = screen.getByRole("region", { name: "info card" });
    expect(section).toHaveAttribute("id", "my-card");
  });

  it("merges a custom className with the default classes", () => {
    const { container } = render(<Card className="extra-class">body</Card>);
    expect(container.firstChild).toHaveClass("extra-class");
    expect(container.firstChild).toHaveClass("rounded-lg");
  });

  // ── Forced-colors hooks ────────────────────────────────────────────────────

  it("has data-card attribute on the root element", () => {
    const { container } = render(<Card>forced colors test</Card>);
    expect(container.querySelector("[data-card]")).toBeInTheDocument();
  });

  it("root element with data-card is the section element", () => {
    const { container } = render(<Card title="fc">body</Card>);
    const el = container.querySelector("[data-card]");
    expect(el?.tagName.toLowerCase()).toBe("section");
  });

  it("has data-card-footer attribute on the footer element when footer prop is provided", () => {
    const { container } = render(
      <Card footer={<span>footer content</span>}>body</Card>
    );
    expect(container.querySelector("[data-card-footer]")).toBeInTheDocument();
  });

  it("does not render data-card-footer when footer prop is omitted", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.querySelector("[data-card-footer]")).not.toBeInTheDocument();
  });

  it("data-card-footer element is a footer HTML element", () => {
    const { container } = render(
      <Card footer={<span>f</span>}>body</Card>
    );
    const el = container.querySelector("[data-card-footer]");
    expect(el?.tagName.toLowerCase()).toBe("footer");
  });

  // ── Border classes (normal mode) ───────────────────────────────────────────

  it("applies the border class to the root section", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.firstChild).toHaveClass("border");
  });

  it("applies the dark border class to the root section", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.firstChild).toHaveClass("dark:border-neutral-800");
  });

  it("applies the border-top class to the footer element", () => {
    const { container } = render(<Card footer="f">body</Card>);
    const footer = container.querySelector("[data-card-footer]");
    expect(footer).toHaveClass("border-t");
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("uses a section element as the root for landmark semantics", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.firstChild?.nodeName).toBe("SECTION");
  });

  it("renders title inside a header element", () => {
    const { container } = render(<Card title="My Title">body</Card>);
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("My Title");
  });

  // ── ReactNode flexibility ──────────────────────────────────────────────────

  it("accepts a ReactNode as title", () => {
    render(
      <Card title={<strong>Bold Title</strong>}>body</Card>
    );
    expect(screen.getByText("Bold Title")).toBeInTheDocument();
  });

  it("accepts a ReactNode as footer", () => {
    render(
      <Card footer={<button>Action</button>}>body</Card>
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("accepts multiple children", () => {
    render(
      <Card>
        <p>paragraph one</p>
        <p>paragraph two</p>
      </Card>
    );
    expect(screen.getByText("paragraph one")).toBeInTheDocument();
    expect(screen.getByText("paragraph two")).toBeInTheDocument();
  });
});
