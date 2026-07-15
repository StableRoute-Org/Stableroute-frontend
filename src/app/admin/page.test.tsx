import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPage from "./page";

const mockFetch = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response);
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AdminPage semantics", () => {
  it("exposes one main landmark and one page heading", async () => {
    mockFetch({ paused: false });
    render(<AdminPage />);

    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1, name: /admin/i })).toHaveLength(1);
    await screen.findByText("Live");
  });

  it("names the pause status panel with an accessible region", async () => {
    mockFetch({ paused: true });
    render(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /router pause status/i }),
      ).toBeInTheDocument();
    });
  });

  it("reflects paused state with aria-pressed on the toggle", async () => {
    mockFetch({ paused: true });
    render(<AdminPage />);

    const toggle = await screen.findByRole("button", { name: /unpause/i });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("reflects live state with aria-pressed false", async () => {
    mockFetch({ paused: false });
    render(<AdminPage />);

    const toggle = await screen.findByRole("button", { name: /^pause$/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the toggle busy and disabled while the request is in flight", async () => {
    let resolvePost: (() => void) | undefined;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ paused: false })),
      } as unknown as Response)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePost = () =>
              resolve({
                ok: true,
                text: () => Promise.resolve("{}"),
              } as unknown as Response);
          }),
      )
      .mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ paused: true })),
      } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(<AdminPage />);
    const toggle = await screen.findByRole("button", { name: /^pause$/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-busy", "true");
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveTextContent(/updating/i);
    });

    resolvePost?.();
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-busy", "false");
      expect(toggle).not.toBeDisabled();
    });
  });

  it("re-enables the toggle after a failed request", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ paused: false })),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        text: () =>
          Promise.resolve(
            JSON.stringify({ error: "server_error", message: "Pause failed" }),
          ),
      } as unknown as Response) as unknown as typeof global.fetch;

    render(<AdminPage />);
    const toggle = await screen.findByRole("button", { name: /^pause$/i });
    fireEvent.click(toggle);

    await screen.findByText(/Pause failed/i);
    expect(toggle).toHaveAttribute("aria-busy", "false");
    expect(toggle).not.toBeDisabled();
  });
});
