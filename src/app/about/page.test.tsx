import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

describe("AboutPage", () => {
  it("renders the about heading and descriptive copy", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { name: /about stableroute/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/liquidity router for stablecoin and fiat-backed token pairs on stellar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/register routing pairs, configure per-pair fees and bounds/i),
    ).toBeInTheDocument();
  });

  it("exposes the main-content focus target with outline-none styling", () => {
    render(<AboutPage />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main.className).toContain("focus:outline-none");
  });
});
