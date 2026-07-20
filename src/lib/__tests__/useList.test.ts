import { renderHook, waitFor } from "@testing-library/react";
import { useList } from "../useList";

describe("useList", () => {
  afterEach(() => jest.useRealTimers());

  it("returns loading state initially", () => {
    const loader = () => new Promise<never[]>(() => {});
    const { result } = renderHook(() => useList(loader));
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("transitions from loading to items on success", async () => {
    const items = [{ id: 1, name: "test" }];
    const loader = jest.fn().mockResolvedValue(items);
    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(items);
    expect(result.current.error).toBeNull();
  });

  it("transitions to error state on failure", async () => {
    const loader = jest.fn().mockRejectedValue(new Error("failed to load"));
    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toBeNull();
    expect(result.current.error).toBe("failed to load");
  });

  it("reload clears previous error before refetching", async () => {
    const loader = jest.fn();
    loader.mockRejectedValueOnce(new Error("first error"));
    loader.mockResolvedValueOnce([{ id: 1 }]);

    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.error).toBe("first error"));

    result.current.reload();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.error).toBeNull();
  });

  it("loads fresh data via reload", async () => {
    const items1 = [{ id: 1 }];
    const items2 = [{ id: 2 }];
    const loader = jest.fn().mockResolvedValueOnce(items1).mockResolvedValueOnce(items2);

    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.items).toEqual([{ id: 1 }]));

    result.current.reload();
    await waitFor(() => expect(result.current.items).toEqual([{ id: 2 }]));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does not update state after unmount", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let resolvePromise!: (value: { id: number }[]) => void;
    const loader = () => new Promise<{ id: number }[]>((resolve) => { resolvePromise = resolve; });

    const { result, unmount } = renderHook(() => useList(loader));
    expect(result.current.loading).toBe(true);

    unmount();
    resolvePromise([{ id: 1 }]);

    await new Promise((r) => setTimeout(r, 50));
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
