import { act, renderHook, waitFor } from '@testing-library/react';
import { useList } from '../useList';

describe('useList', () => {
  it('returns loading state initially', () => {
    const loader = () => new Promise<never[]>(() => {});
    const { result } = renderHook(() => useList(loader));

    expect(result.current.status).toBe('loading');
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect('data' in result.current).toBe(false);
    expect('error' in result.current).toBe(false);
  });

  it('transitions from loading to success with data', async () => {
    const data = [{ id: 1, name: 'test' }];
    const loader = jest.fn().mockResolvedValue(data);
    const { result } = renderHook(() => useList(loader));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({ status: 'success', data });
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect('error' in result.current).toBe(false);
  });

  it('transitions to error state on failure', async () => {
    const loader = jest.fn().mockRejectedValue(new Error('failed to load'));
    const { result } = renderHook(() => useList(loader));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'failed to load',
    });
    expect(result.current.refetch).toEqual(expect.any(Function));
    expect('data' in result.current).toBe(false);
  });

  it('uses a fallback message when a rejection has no message', async () => {
    const loader = jest.fn().mockRejectedValue({});
    const { result } = renderHook(() => useList(loader));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'failed to load',
    });
  });

  it('clears a previous error while refetching', async () => {
    let resolveRefetch!: (value: { id: number }[]) => void;
    const loader = jest
      .fn()
      .mockRejectedValueOnce(new Error('first error'))
      .mockImplementationOnce(
        () =>
          new Promise<{ id: number }[]>((resolve) => (resolveRefetch = resolve))
      );
    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => void result.current.refetch());
    expect(result.current.status).toBe('loading');
    expect('error' in result.current).toBe(false);

    act(() => resolveRefetch([{ id: 1 }]));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({
      status: 'success',
      data: [{ id: 1 }],
    });
  });

  it('loads fresh data via refetch', async () => {
    const loader = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useList(loader));
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => void (await result.current.refetch()));

    expect(result.current).toMatchObject({
      status: 'success',
      data: [{ id: 2 }],
    });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('ignores stale results from overlapping refetches', async () => {
    let resolveFirst!: (value: { id: number }[]) => void;
    let resolveSecond!: (value: { id: number }[]) => void;
    const loader = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<{ id: number }[]>((resolve) => (resolveFirst = resolve))
      )
      .mockImplementationOnce(
        () =>
          new Promise<{ id: number }[]>((resolve) => (resolveSecond = resolve))
      );
    const { result } = renderHook(() => useList(loader));

    act(() => void result.current.refetch());
    act(() => resolveFirst([{ id: 1 }]));
    expect(result.current.status).toBe('loading');

    act(() => resolveSecond([{ id: 2 }]));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({
      status: 'success',
      data: [{ id: 2 }],
    });
  });

  it('ignores a stale error from an overlapping refetch', async () => {
    let rejectFirst!: (reason: Error) => void;
    let resolveSecond!: (value: { id: number }[]) => void;
    const loader = jest
      .fn()
      .mockImplementationOnce(
        () => new Promise<never>((_, reject) => (rejectFirst = reject))
      )
      .mockImplementationOnce(
        () =>
          new Promise<{ id: number }[]>((resolve) => (resolveSecond = resolve))
      );
    const { result } = renderHook(() => useList(loader));

    act(() => void result.current.refetch());
    act(() => rejectFirst(new Error('stale failure')));
    expect(result.current.status).toBe('loading');

    act(() => resolveSecond([{ id: 2 }]));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({
      status: 'success',
      data: [{ id: 2 }],
    });
  });

  it('does not update state after unmount', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let resolvePromise!: (value: { id: number }[]) => void;
    const loader = () =>
      new Promise<{ id: number }[]>((resolve) => {
        resolvePromise = resolve;
      });
    const { result, unmount } = renderHook(() => useList(loader));
    expect(result.current.status).toBe('loading');

    unmount();
    await act(async () => resolvePromise([{ id: 1 }]));

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
