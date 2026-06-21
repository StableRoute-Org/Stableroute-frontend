import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ApiKeysPage from "./page";
import { ToastProvider } from "@/components/ToastProvider";

const renderPage = () =>
  render(
    <ToastProvider>
      <ApiKeysPage />
    </ToastProvider>
  );

const mockSuccessfulCreate = () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ key: "srk_secret_123" }),
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ prefix: "srk_secr", label: "prod", createdAt: 1 }],
      }),
    } as unknown as Response);
};

const createKey = async () => {
  renderPage();

  await waitFor(() => {
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/api-keys",
      expect.any(Object)
    );
  });

  fireEvent.change(screen.getByLabelText(/label/i), {
    target: { value: "prod" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create/i }));

  await waitFor(() => {
    expect(screen.getByText("srk_secret_123")).toBeInTheDocument();
  });
};

describe("ApiKeysPage", () => {
  const originalFetch = globalThis.fetch;
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard);
    } else {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
    }
    document.execCommand = originalExecCommand;
    jest.restoreAllMocks();
  });

  it("copies a newly created key with the Clipboard API and shows feedback", async () => {
    mockSuccessfulCreate();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await createKey();
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("srk_secret_123");
      expect(screen.getByText(/api key copied/i)).toBeInTheDocument();
    });
  });

  it("falls back to a temporary textarea when navigator.clipboard is unavailable", async () => {
    mockSuccessfulCreate();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    document.execCommand = jest.fn().mockReturnValue(true);

    await createKey();
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith("copy");
      expect(screen.getByText(/api key copied/i)).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue("srk_secret_123")).not.toBeInTheDocument();
  });

  it("shows an error toast when copy fails", async () => {
    mockSuccessfulCreate();
    const writeText = jest.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await createKey();
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/could not copy/i);
    });
  });

  it("ignores rapid repeated clicks while a copy is pending", async () => {
    mockSuccessfulCreate();
    let resolveCopy: () => void = () => {};
    const writeText = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        })
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await createKey();
    const button = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copying/i })).toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /copying/i }));
    expect(writeText).toHaveBeenCalledTimes(1);

    resolveCopy();
    await waitFor(() => {
      expect(screen.getByText(/api key copied/i)).toBeInTheDocument();
    });
  });
});
