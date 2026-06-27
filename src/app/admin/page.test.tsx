import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminPage from "./page";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("AdminPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("exposes the live state via aria-pressed=false", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ paused: false }));

    render(<AdminPage />);

    const btn = await screen.findByRole("button", { name: "Pause" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("exposes the paused state via aria-pressed=true", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ paused: true }));

    render(<AdminPage />);

    const btn = await screen.findByRole("button", { name: "Unpause" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("disables the toggle and marks it busy while the request is in flight", async () => {
    let resolvePost: (value: Response) => void = () => {};
    global.fetch = jest.fn((url: string) => {
      if (url.endsWith("/api/v1/admin/status")) {
        return Promise.resolve(jsonResponse({ paused: false }));
      }
      return new Promise<Response>((resolve) => {
        resolvePost = resolve;
      });
    }) as unknown as typeof global.fetch;

    render(<AdminPage />);

    const btn = await screen.findByRole("button", { name: "Pause" });
    fireEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
    expect(btn).toHaveAttribute("aria-busy", "true");

    // Let the pending request settle so the busy flag clears.
    resolvePost(jsonResponse({}));
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
