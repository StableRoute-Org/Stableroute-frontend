import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>hi</Badge>);
    expect(screen.getByText(/hi/)).toBeInTheDocument();
  });

  it("applies the neutral variant with semantic color tokens", () => {
    render(<Badge variant="neutral">neutral</Badge>);
    const badge = screen.getByText("neutral");
    expect(badge.className).toMatch(/bg-neutral-100/);
    expect(badge.className).toMatch(/text-neutral-700/);
    expect(badge.className).toMatch(/dark:bg-neutral-800/);
    expect(badge.className).toMatch(/dark:text-neutral-300/);
  });

  it("applies the ok (success) variant with semantic color tokens", () => {
    render(<Badge variant="ok">active</Badge>);
    const badge = screen.getByText("active");
    expect(badge.className).toMatch(/bg-success-100/);
    expect(badge.className).toMatch(/text-success-800/);
    expect(badge.className).toMatch(/dark:bg-success-950/);
    expect(badge.className).toMatch(/dark:text-success-300/);
  });

  it("applies the warning variant with semantic color tokens", () => {
    render(<Badge variant="warning">paused</Badge>);
    const badge = screen.getByText("paused");
    expect(badge.className).toMatch(/bg-warning-100/);
    expect(badge.className).toMatch(/text-warning-800/);
    expect(badge.className).toMatch(/dark:bg-warning-950/);
    expect(badge.className).toMatch(/dark:text-warning-300/);
  });

  it("applies the danger variant with semantic color tokens", () => {
    render(<Badge variant="danger">revoked</Badge>);
    const badge = screen.getByText("revoked");
    expect(badge.className).toMatch(/bg-danger-100/);
    expect(badge.className).toMatch(/text-danger-800/);
    expect(badge.className).toMatch(/dark:bg-danger-950/);
    expect(badge.className).toMatch(/dark:text-danger-300/);
  });

  it("renders with default neutral variant when no variant specified", () => {
    render(<Badge>default</Badge>);
    const badge = screen.getByText("default");
    expect(badge.className).toMatch(/bg-neutral-100/);
    expect(badge.className).toMatch(/text-neutral-700/);
  });

  it("has correct styling classes for all variants", () => {
    const { rerender } = render(<Badge variant="neutral">x</Badge>);
    let badge = screen.getByText("x");
    expect(badge.className).toMatch(/inline-flex/);
    expect(badge.className).toMatch(/rounded-full/);
    expect(badge.className).toMatch(/px-2/);
    expect(badge.className).toMatch(/py-0.5/);
    expect(badge.className).toMatch(/text-xs/);
    expect(badge.className).toMatch(/font-medium/);

    rerender(<Badge variant="ok">x</Badge>);
    badge = screen.getByText("x");
    expect(badge.className).toMatch(/success/);
  });
});
