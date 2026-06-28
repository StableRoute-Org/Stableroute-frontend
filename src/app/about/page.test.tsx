import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

describe("AboutPage", () => {
  it("renders the about heading and descriptive copy", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "About StableRoute" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /StableRoute is a liquidity router for stablecoin and fiat-backed token pairs on Stellar/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Use this dashboard to register routing pairs, configure per-pair fees and bounds/i,
      ),
    ).toBeInTheDocument();
  });

  it("keeps the main content focus target available for skip-link focus", () => {
    const { container } = render(<AboutPage />);

    const main = container.querySelector("#main-content");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveClass("focus:outline-none");
  });
});
