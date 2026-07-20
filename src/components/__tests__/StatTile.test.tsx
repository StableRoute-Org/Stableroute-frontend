import { render, screen } from "@testing-library/react";
import { StatTile } from "../StatTile";

describe("StatTile", () => {
  it("renders string label and value with dt/dd semantics", () => {
    render(<StatTile label="Pairs" value="42" />);
    expect(screen.getByText("Pairs").tagName).toBe("DT");
    expect(screen.getByText("42").closest("dd")).not.toBeNull();
  });

  it("renders ReactNode label and value", () => {
    render(
      <StatTile
        label={<span data-testid="label-node">Volume</span>}
        value={<strong data-testid="value-node">1,024</strong>}
      />,
    );
    expect(screen.getByTestId("label-node")).toBeInTheDocument();
    expect(screen.getByTestId("value-node")).toBeInTheDocument();
  });
});
