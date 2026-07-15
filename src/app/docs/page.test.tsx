import { render, screen } from "@testing-library/react";
import DocsPage from "./page";

const sections = [
  { h: "POST /api/v1/pairs", p: "Register a (source, destination) routing pair. Idempotent." },
  { h: "GET /api/v1/pairs", p: "List every registered pair. ETag caching." },
  { h: "PATCH /api/v1/pairs/:src/:dest/fee_bps", p: "Set the per-pair routing fee in basis points (0..1000)." },
  { h: "GET /api/v1/quote", p: "Request a quote for ?source_asset=&dest_asset=&amount=." },
  { h: "POST /api/v1/admin/{pause,unpause}", p: "Operator-only pause / resume flag." },
];

describe("DocsPage", () => {
  it("renders the page heading", () => {
    render(<DocsPage />);
    expect(
      screen.getByRole("heading", { name: /API documentation/i }),
    ).toBeInTheDocument();
  });

  it("renders #main-content focus target", () => {
    render(<DocsPage />);
    const main = document.getElementById("main-content");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("tabIndex", "-1");
  });

  it("renders the openapi link pointing to /api/v1/openapi.json", () => {
    render(<DocsPage />);
    const link = screen.getByRole("link", { name: /GET \/api\/v1\/openapi\.json/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/api/v1/openapi.json");
  });

  it("renders all endpoint sections with term and description", () => {
    render(<DocsPage />);

    for (const section of sections) {
      // Each endpoint renders as a <dt> term
      const term = screen.getByText(section.h);
      expect(term).toBeInTheDocument();
      expect(term.tagName).toBe("DT");

      // Each description renders as a <dd> definition
      const definition = screen.getByText(section.p);
      expect(definition).toBeInTheDocument();
      expect(definition.tagName).toBe("DD");
    }
  });

  it("renders exactly the expected number of endpoint terms", () => {
    render(<DocsPage />);
    const terms = document.querySelectorAll("dt");
    expect(terms).toHaveLength(sections.length);
  });

  it("renders exactly the expected number of endpoint definitions", () => {
    render(<DocsPage />);
    const definitions = document.querySelectorAll("dd");
    expect(definitions).toHaveLength(sections.length);
  });
});
