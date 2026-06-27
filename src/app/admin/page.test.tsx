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

  it("does not fire a second request while one is in flight", async () => {
    let postCount = 0;
    let resolvePost: (value: Response) => void = () => {};
    global.fetch = jest.fn((url: string) => {
      if (url.endsWith("/api/v1/admin/status")) {
        return Promise.resolve(jsonResponse({ paused: false }));
      }
      postCount += 1;
      return new Promise<Response>((resolve) => {
        resolvePost = resolve;
      });
    }) as unknown as typeof global.fetch;

    render(<AdminPage />);

    const btn = await screen.findByRole("button", { name: "Pause" });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());

    fireEvent.click(btn);
    expect(postCount).toBe(1);

    resolvePost(jsonResponse({}));
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("calls the unpause endpoint when currently paused", async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url.endsWith("/api/v1/admin/unpause")) {
        return Promise.resolve(jsonResponse({}));
      }
      return Promise.resolve(jsonResponse({ paused: true }));
    });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(<AdminPage />);

    const btn = await screen.findByRole("button", { name: "Unpause" });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/admin/unpause"),
        expect.anything()
      )
    );
  });

  it("shows an error and re-enables the toggle when the request fails", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.endsWith("/api/v1/admin/status")) {
        return Promise.resolve(jsonResponse({ paused: false }));
      }
      return Promise.reject(new Error("Toggle failed"));
    }) as unknown as typeof global.fetch;

    render(<AdminPage />);

    const btn = await screen.findByRole("button", { name: "Pause" });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Toggle failed")
    );
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "false");
  });

  it("surfaces a status load failure via role=alert", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Status unavailable"));

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Status unavailable")
    );
  });
});
