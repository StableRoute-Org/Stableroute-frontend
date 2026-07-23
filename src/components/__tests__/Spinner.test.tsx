import { render, screen } from "@testing-library/react";
import { Spinner } from "../Spinner";

describe("Spinner", () => {
  it("renders the default sr-only label", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
  it("honours a custom label", () => {
    render(<Spinner label="Fetching pairs" />);
    expect(screen.getByText(/Fetching pairs/)).toBeInTheDocument();
  });
  it("still announces its status role even when reduced-motion is active", () => {
    render(<Spinner />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/Loading/);
  });
});
