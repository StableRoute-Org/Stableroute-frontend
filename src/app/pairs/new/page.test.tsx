import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockApiPost = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock(
  "@/lib/apiClient",
  () => ({
    apiPost: mockApiPost,
  })
);

const NewPairPage = require("./page").default;

describe("NewPairPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockApiPost.mockReset();
  });

  function submitPair(source: string, destination: string) {
    fireEvent.change(screen.getByLabelText("Source"), {
      target: { value: source },
    });
    fireEvent.change(screen.getByLabelText("Destination"), {
      target: { value: destination },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Register pair/i }).closest("form")!);
  }

  it("normalizes lowercase and surrounding whitespace before submit", async () => {
    mockApiPost.mockResolvedValueOnce({});

    render(<NewPairPage />);
    submitPair(" usdc ", " eurc ");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pairs");
    });
    expect(mockApiPost).toHaveBeenCalledWith("/api/v1/pairs", {
      source: "USDC",
      destination: "EURC",
    });
  });

  it("keeps a polite status region mounted before submission", () => {
    render(<NewPairPage />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toBeEmptyDOMElement();
  });

  it("announces pending and success states before redirecting", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => "{}",
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair("xlm", "usdc");

    expect(screen.getByRole("status")).toHaveTextContent("Registering pair...");
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Pair registered. Redirecting to pairs."
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pairs");
    });
  });

  it.each(["USD-C", "USD C", "ABCDEFGHIJKLM"])(
    "rejects invalid source asset code %s with accessible field errors",
    async (code) => {
      render(<NewPairPage />);
      submitPair(code, "EURC");

      const sourceInput = document.getElementById("source");
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/ASCII letters or numbers/i);
      });
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(sourceInput).toHaveAttribute("aria-invalid", "true");
      expect(sourceInput).toHaveAttribute("aria-describedby", "source-err");
      expect(mockApiPost).not.toHaveBeenCalled();
    }
  );

  it("rejects pairs that are identical after trimming and uppercasing", async () => {
    render(<NewPairPage />);
    submitPair(" usdc ", "USDC");

    const destinationInput = document.getElementById("destination");
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/must differ/i);
    });
    expect(destinationInput).toHaveAttribute("aria-invalid", "true");
    expect(destinationInput).toHaveAttribute("aria-describedby", "destination-err");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("validates empty fields with inline errors instead of native browser validation", async () => {
    render(<NewPairPage />);
    fireEvent.submit(screen.getByRole("button", { name: /Register pair/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(2);
    });
    expect(document.getElementById("source")).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById("destination")).toHaveAttribute("aria-invalid", "true");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("clears an identical-pair error when source changes", async () => {
    render(<NewPairPage />);
    submitPair("USDC", "USDC");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/must differ/i);
    });
    fireEvent.change(screen.getByLabelText("Source"), {
      target: { value: "XLM" },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("surfaces backend errors without losing the normalized request body", async () => {
    mockApiPost.mockRejectedValueOnce(new Error("Pair already exists"));

    render(<NewPairPage />);
    submitPair("xlm", "usdc");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Pair already exists/i);
    });
    expect(mockApiPost).toHaveBeenCalledWith("/api/v1/pairs", {
      source: "XLM",
      destination: "USDC",
    });
  });

  it("renders a polite live-region status node in the DOM on first paint", () => {
    render(<NewPairPage />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    // Empty on first paint so screen readers do not announce anything
    // until the user submits.
    expect(status).toHaveTextContent("");
  });

  it("announces the pending state via the polite live region while submitting", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    const mockFetch = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair("USDC", "EURC");

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Registering pair/i);
    });

    // Cleanly resolve the in-flight request so the test does not hang.
    resolveFetch!({
      ok: true,
      text: async () => "{}",
    } as unknown as Response);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pairs");
    });
  });

  it("announces success via the polite live region and clears it on error", async () => {
    // First submit: success path — assert the success message appears.
    const successFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => "{}",
    } as unknown as Response);
    globalThis.fetch = successFetch as unknown as typeof globalThis.fetch;

    const { unmount } = render(<NewPairPage />);
    submitPair("USDC", "EURC");

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /Pair registered\. Redirecting/i,
      );
    });
    unmount();

    // Second submit: error path — assert the polite status is cleared
    // (so it does not announce alongside the error) and the error alert
    // still fires.
    const errorFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: "invalid_request",
          message: "Pair already exists",
        }),
    } as unknown as Response);
    globalThis.fetch = errorFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair("xlm", "usdc");

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("");
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/Pair already exists/i);
  });
});
