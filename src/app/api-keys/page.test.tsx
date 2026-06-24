import { render, screen, waitFor } from "@testing-library/react";
import ApiKeysPage from "./page";

describe("ApiKeysPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    globalThis.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof globalThis.fetch;
    render(<ApiKeysPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders api keys in a single polite live region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        items: [{ prefix: "sk_abc", label: "Production", createdAt: Date.now() }],
      }),
      json: async () => ({
        items: [{ prefix: "sk_abc", label: "Production", createdAt: Date.now() }],
      }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Production")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
      json: async () => ({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error("Unauthorized"));

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Unauthorized/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
      json: async () => ({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });
});
