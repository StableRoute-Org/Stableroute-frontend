import { render, screen } from "@testing-library/react";
import DocsPage from "./page";
import { endpoints } from "@/lib/endpoints";

describe("DocsPage", () => {
  it("renders a heading for every endpoint in the registry", () => {
    render(<DocsPage />);
    for (const endpoint of endpoints) {
      // `getByRole` is more robust as it isn't tied to the exact text content
      // which includes the method.
      const heading = screen.getByRole("heading", {
        name: new RegExp(`${endpoint.method} ${endpoint.path}`, "i"),
      });
      expect(heading).toBeInTheDocument();
      // Sibling of heading should contain the description.
      expect(heading.nextElementSibling).toHaveTextContent(endpoint.description);
    }
  });

  it("renders parameters for endpoints that have them", () => {
    render(<DocsPage />);
    const endpointWithParams = endpoints.find((e) => e.params && e.params.length > 0);
    expect(endpointWithParams).toBeDefined(); // Sanity check

    for (const param of endpointWithParams!.params!) {
      // Check that the parameter name, type, and description are all rendered.
      const paramName = screen.getByText(param.name);
      expect(paramName).toBeInTheDocument();
      expect(paramName.nextElementSibling).toHaveTextContent(param.type);
      expect(paramName.parentElement!.nextElementSibling).toHaveTextContent(param.description);
    }
  });

  it("does not render a parameters list for an endpoint with no params", () => {
    render(<DocsPage />);
    const endpointWithoutParams = endpoints.find((e) => !e.params || e.params.length === 0);
    expect(endpointWithoutParams).toBeDefined();

    const heading = screen.getByRole("heading", { name: new RegExp(endpointWithoutParams!.path) });
    const section = heading.closest("section")!;
    expect(section).not.toHaveTextContent(/Parameters/);
  });

  it("marks openapi.json as an external link", () => {
    render(<DocsPage />);
    const link = screen.getByRole("link", { name: /openapi\.json/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
