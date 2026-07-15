import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("exposes the create form through a labelled group and associated field label", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("group", { name: /Create API key/i })).toBeInTheDocument();
    const labelInput = screen.getByLabelText(/API key label/i);
    expect(labelInput).toBeRequired();
    expect(labelInput).toHaveAttribute("maxlength", "64");
  });

  it("creates an API key and announces the one-time secret", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ items: [] }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ key: "sk_live_secret" }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [{ prefix: "sk_live", label: "Production", createdAt: Date.now() }],
          }),
      } as unknown as Response);
    global.fetch = mockFetch as unknown as typeof global.fetch;

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/API key label/i), {
      target: { value: "Production" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("sk_live_secret");
    });
    expect(screen.getByText("Production")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/api/v1/api-keys",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ label: "Production" }),
      })
    );
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
});
