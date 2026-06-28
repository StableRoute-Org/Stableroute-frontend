import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders the 404 heading and not-found copy", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText("That page does not exist.")).toBeInTheDocument();
  });

  it("links users back to the home page", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
