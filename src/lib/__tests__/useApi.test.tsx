import { renderHook } from "@testing-library/react";
import { useApi } from "../useApi";

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

describe("useApi", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("aborts the in-flight request on cleanup without surfacing an error", async () => {
    let fetchSignal: AbortSignal | null = null;
    globalThis.fetch = jest.fn((_url, init) => {
      fetchSignal = (init as RequestInit).signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        fetchSignal?.addEventListener("abort", () => reject(abortError()));
      });
    }) as unknown as typeof globalThis.fetch;

    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => useApi<{ ok: boolean }>(path),
      { initialProps: { path: "/api/v1/slow" } }
    );

    expect(result.current.status).toBe("loading");
    rerender({ path: null });

    expect(fetchSignal?.aborted).toBe(true);
    await Promise.resolve();
    expect(result.current.status).toBe("loading");
  });
});
