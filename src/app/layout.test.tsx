import { render } from "@testing-library/react";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders children and applies the self-hosted font variable", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child" />
      </RootLayout>
    );

    const html = container.querySelector("html");
    expect(html).toHaveAttribute("lang", "en");
    expect(html?.className).toBeTruthy();
    expect(container.querySelector("[data-testid='child']")).toBeInTheDocument();
  });
});
