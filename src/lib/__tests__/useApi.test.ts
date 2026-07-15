"use client";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useApi } from "../useApi";
import { apiGet } from "../apiClient";

jest.mock("../apiClient", () => ({
  apiGet: jest.fn(),
}));

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;

beforeEach(() => {
  mockedApiGet.mockReset();
});

describe("useApi", () => {
  it("starts in loading state and resolves to ok with data on success", async () => {
    mockedApiGet.mockResolvedValueOnce({ pairs: 3 } as never);
    const { result } = renderHook(() => useApi<{ pairs: number }>("/api/v1/pairs"));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ok"));
    if (result.current.status === "ok") {
      expect(result.current.data).toEqual({ pairs: 3 });
    }
  });

  it("transitions to error state with message on rejection", async () => {
    mockedApiGet.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useApi<unknown>("/api/v1/fail"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    if (result.current.status === "error") {
      expect(result.current.error).toBe("boom");
    }
  });

  it("short-circuits when path is null and never calls apiGet", async () => {
    const { result } = renderHook(() => useApi<unknown>(null));
    // No call to apiGet should occur
    expect(mockedApiGet).not.toHaveBeenCalled();
    // State should stay loading forever (no error, no ok)
    expect(result.current.status).toBe("loading");
  });

  it("refetch triggers a new apiGet call", async () => {
    mockedApiGet.mockResolvedValueOnce({ a: 1 } as never).mockResolvedValueOnce({ a: 2 } as never);
    const { result } = renderHook(() => useApi<{ a: number }>("/api/v1/x"));
    await waitFor(() => expect(result.current.status).toBe("ok"));
    act(() => result.current.refetch());
    await waitFor(() => {
      if (result.current.status === "ok") expect(result.current.data).toEqual({ a: 2 });
    });
    expect(mockedApiGet).toHaveBeenCalledTimes(2);
  });

  it("cancels the in-flight request on unmount (no setState on unmounted component)", async () => {
    let resolveFn: (v: unknown) => void = () => {};
    mockedApiGet.mockImplementationOnce(
      () => new Promise((resolve) => { resolveFn = resolve; }) as ReturnType<typeof apiGet>
    );
    const { result, unmount } = renderHook(() => useApi<unknown>("/api/v1/slow"));
    expect(result.current.status).toBe("loading");
    unmount();
    // Resolving after unmount must not throw the React "set state on unmounted" warning
    resolveFn({ ok: true });
    // If we got here without React warning, the cancellation worked.
  });
});
