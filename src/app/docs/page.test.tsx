import { render, screen } from "@testing-library/react";
import DocsPage from "./page";

describe("DocsPage", () => {
  const originalEnv = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    else process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = originalEnv;
  });

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
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("resolves openapi.json href from the env-driven API base", () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = "https://api.example.test";
    render(<DocsPage />);
    const link = screen.getByRole("link", { name: /openapi\.json/i });
    expect(link).toHaveAttribute(
      "href",
      "https://api.example.test/api/v1/openapi.json",
    );
  });

  it("falls back to localhost API base when env is not set", () => {
    delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    render(<DocsPage />);
    const link = screen.getByRole("link", { name: /openapi\.json/i });
    expect(link).toHaveAttribute(
      "href",
      "http://localhost:3001/api/v1/openapi.json",
    );
  });
});
