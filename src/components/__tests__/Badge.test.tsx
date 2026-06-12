import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>hi</Badge>);
    expect(screen.getByText(/hi/)).toBeInTheDocument();
  });
  it("applies the danger variant", () => {
    render(<Badge variant="danger">x</Badge>);
    expect(screen.getByText("x").className).toMatch(/rose/);
  });
});
