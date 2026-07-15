import { render } from "@testing-library/react";
import Loading from "./loading";

describe("Loading skeleton", () => {
  it("exposes the main-content focus target", () => {
    render(<Loading />);
    const main = document.getElementById("main-content");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("tabIndex", "-1");
  });

  // loading.tsx renders one title bar and two body-line placeholders.
  it("renders three pulse skeleton placeholders", () => {
    render(<Loading />);
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });
});
