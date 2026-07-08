import { render, screen } from "@testing-library/react";
import DocsPage from "./page";

const expectedSections = [
  {
    h: "POST /api/v1/pairs",
    p: "Register a (source, destination) routing pair. Idempotent.",
  },
  { h: "GET /api/v1/pairs", p: "List every registered pair. ETag caching." },
  {
    h: "PATCH /api/v1/pairs/:src/:dest/fee_bps",
    p: "Set the per-pair routing fee in basis points (0..1000).",
  },
  {
    h: "GET /api/v1/quote",
    p: "Request a quote for ?source_asset=&dest_asset=&amount=.",
  },
  {
    h: "POST /api/v1/admin/{pause,unpause}",
    p: "Operator-only pause / resume flag.",
  },
];

describe("DocsPage", () => {
  it("renders the docs heading and focus target", () => {
    render(<DocsPage />);

    expect(
      screen.getByRole("heading", { name: /API documentation/i }),
    ).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabIndex", "-1");
  });

  it("renders every endpoint section as a definition list", () => {
    render(<DocsPage />);

    expect(document.querySelectorAll("dt")).toHaveLength(expectedSections.length);
    expect(document.querySelectorAll("dd")).toHaveLength(expectedSections.length);

    for (const section of expectedSections) {
      expect(screen.getByText(section.h)).toBeInTheDocument();
      expect(screen.getByText(section.p)).toBeInTheDocument();
    }
  });

  it("links to the OpenAPI JSON endpoint", () => {
    render(<DocsPage />);

    expect(
      screen.getByRole("link", { name: "GET /api/v1/openapi.json" }),
    ).toHaveAttribute("href", "/api/v1/openapi.json");
  });
});
