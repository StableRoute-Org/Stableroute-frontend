import { renderHook, waitFor, act } from "@testing-library/react";
import { useList } from "../useList";

describe("useList", () => {
  it("returns loading state initially", () => {
    const loader = () => new Promise<string[]>(() => {}); // never resolves
    const { result } = renderHook(() => useList(loader));
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toBeNull();
  });

  it("returns items on success", async () => {
    const data = ["a", "b"];
    const loader = () => Promise.resolve(data);
    const { result } = renderHook(() => useList(loader));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it("returns error on failure", async () => {
    const error = "fetch error";
    const loader = () => Promise.reject(new Error(error));
    const { result } = renderHook(() => useList(loader));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("reloads when reload is called", async () => {
    let callCount = 0;
    const loader = () => {
      callCount++;
      return Promise.resolve([callCount]);
    };

    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([1]);

    await act(async () => {
      await result.current.reload();
    });
    
    expect(result.current.items).toEqual([2]);
    expect(callCount).toBe(2);
  });
});
