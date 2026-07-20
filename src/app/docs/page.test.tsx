import { render, screen } from "@testing-library/react";
import DocsPage from "./page";

describe("DocsPage", () => {
  it("lists endpoint sections", () => {
    render(<DocsPage />);
    expect(screen.getByText(/POST \/api\/v1\/pairs/i)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/quote/i)).toBeInTheDocument();
  });

  it("marks openapi.json as an external link", () => {
    render(<DocsPage />);
    const link = screen.getByRole("link", { name: /openapi\.json/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
