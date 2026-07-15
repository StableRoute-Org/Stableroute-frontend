import { render, screen, waitFor } from "@testing-library/react";
import ApiKeysPage from "./page";

describe("ApiKeysPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
    render(<ApiKeysPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders api keys in a single polite live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Unauthorized"));

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Unauthorized/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });

  it("separates recently created keys into a distinct section", async () => {
    const now = Date.now();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: "sk_old", label: "Old key", createdAt: now - 10 * 60 * 1000 },
            { prefix: "sk_new", label: "New key", createdAt: now - 60 * 1000 },
          ],
        }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Recently created/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /Existing keys/i })).toBeInTheDocument();
    expect(screen.getByText("New key")).toBeInTheDocument();
    expect(screen.getByText("Old key")).toBeInTheDocument();
  });

  it("shows only existing section when no recent keys", async () => {
    const now = Date.now();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: "sk_old", label: "Old key", createdAt: now - 10 * 60 * 1000 },
          ],
        }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Old key")).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: /Recently created/i })).not.toBeInTheDocument();
  });
});
