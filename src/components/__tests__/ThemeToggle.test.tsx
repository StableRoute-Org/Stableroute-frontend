import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists theme preference to localStorage", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /theme/i }));
    expect(window.localStorage.getItem("stableroute.theme")).toBeTruthy();
  });
});
