import { act, renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';
import * as apiClient from '../apiClient';

jest.mock('../apiClient');
const mockApiGet = apiClient.apiGet as jest.MockedFunction<
  typeof apiClient.apiGet
>;

describe('useApi', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns loading state initially', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useApi('/test'));

    expect(result.current.status).toBe('loading');
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect('data' in result.current).toBe(false);
    expect('error' in result.current).toBe(false);
  });

  it('returns success state with data', async () => {
    const data = { value: 42 };
    mockApiGet.mockResolvedValue(data);
    const { result } = renderHook(() => useApi<typeof data>('/test'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({ status: 'success', data });
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect('error' in result.current).toBe(false);
  });

  it('returns error state on fetch failure', async () => {
    mockApiGet.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'network error',
    });
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect('data' in result.current).toBe(false);
  });

  it('uses a fallback message when a rejection has no message', async () => {
    mockApiGet.mockRejectedValue({});
    const { result } = renderHook(() => useApi('/test'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'failed to load',
    });
  });

  it('returns idle and does not fetch when path is null', () => {
    const { result } = renderHook(() => useApi(null));

    expect(result.current.status).toBe('idle');
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('returns to idle when the path is cleared', async () => {
    mockApiGet.mockResolvedValue({ value: 1 });
    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => useApi<{ value: number }>(path),
      { initialProps: { path: '/test' } as { path: string | null } }
    );
    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender({ path: null });

    expect(result.current.status).toBe('idle');
    expect(mockApiGet).toHaveBeenCalledTimes(1);
  });

  it('transitions through loading when refetch is called', async () => {
    let resolveRefetch!: (value: { value: number }) => void;
    mockApiGet
      .mockResolvedValueOnce({ value: 1 })
      .mockImplementationOnce(
        () =>
          new Promise<{ value: number }>(
            (resolve) => (resolveRefetch = resolve)
          )
      );
    const { result } = renderHook(() => useApi<{ value: number }>('/test'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.refetch());
    expect(result.current.status).toBe('loading');

    act(() => resolveRefetch({ value: 2 }));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({
      status: 'success',
      data: { value: 2 },
    });
    expect(mockApiGet).toHaveBeenCalledTimes(2);
  });

  it('ignores a successful response after unmount', async () => {
    let resolveRequest!: (value: { value: number }) => void;
    mockApiGet.mockImplementation(
      () =>
        new Promise<{ value: number }>((resolve) => (resolveRequest = resolve))
    );
    const { unmount } = renderHook(() => useApi<{ value: number }>('/test'));

    unmount();
    await act(async () => resolveRequest({ value: 1 }));

    expect(mockApiGet).toHaveBeenCalledTimes(1);
  });

  it('ignores a rejected response after unmount', async () => {
    let rejectRequest!: (reason: Error) => void;
    mockApiGet.mockImplementation(
      () => new Promise<never>((_, reject) => (rejectRequest = reject))
    );
    const { unmount } = renderHook(() => useApi('/test'));

    unmount();
    await act(async () => rejectRequest(new Error('late failure')));

    expect(mockApiGet).toHaveBeenCalledTimes(1);
  });
});
