import { render, screen } from "@testing-library/react";
import { StatTile } from "../StatTile";

describe("StatTile", () => {
  it("renders unchanged when no delta or trend is provided", () => {
    render(<StatTile label="Pairs" value="12" />);

    expect(screen.getByText("Pairs")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByText(/Trend /)).not.toBeInTheDocument();
  });

  it("renders a positive delta as an accessible upward trend", () => {
    render(<StatTile label="Volume" value="120" delta={8} />);

    const visible = screen.getByText("Up +8");
    expect(visible).toBeInTheDocument();
    expect(screen.getByText("Trend up by 8")).toHaveClass("sr-only");
    expect(visible.parentElement?.className).toMatch(/emerald/);
  });

  it("renders a negative delta as an accessible downward trend", () => {
    render(<StatTile label="Errors" value="3" delta={-2} />);

    const visible = screen.getByText("Down -2");
    expect(visible).toBeInTheDocument();
    expect(screen.getByText("Trend down by 2")).toHaveClass("sr-only");
    expect(visible.parentElement?.className).toMatch(/rose/);
  });

  it("renders zero delta as a flat trend", () => {
    render(<StatTile label="Routes" value="50" delta={0} />);

    const visible = screen.getByText("Flat 0");
    expect(visible).toBeInTheDocument();
    expect(screen.getByText("Trend flat by 0")).toHaveClass("sr-only");
    expect(visible.parentElement?.className).toMatch(/neutral/);
  });

  it("can render an explicit trend without a numeric delta", () => {
    render(<StatTile label="Status" value="Live" trend="up" />);

    expect(screen.getByText("Up")).toBeInTheDocument();
    expect(screen.getByText("Trend up")).toHaveClass("sr-only");
  });
});
