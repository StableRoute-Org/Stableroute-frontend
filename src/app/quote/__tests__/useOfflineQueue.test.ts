import { renderHook, act } from '@testing-library/react';
import { useOfflineQueue } from '../useOfflineQueue';
import { OFFLINE_QUEUE_KEY, QueuedSwapMutation } from '../offlineQueueModel';

describe('useOfflineQueue Hook Unit Tests (#729)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('detects online and offline events', () => {
    const { result } = renderHook(() => useOfflineQueue());
    expect(result.current.isOffline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOffline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOffline).toBe(false);
  });

  it('enqueues mutations and updates state + localStorage', () => {
    const { result } = renderHook(() => useOfflineQueue());

    act(() => {
      const res = result.current.enqueueMutation({
        source: 'USDC',
        dest: 'EURC',
        amount: '100',
      });
      expect(res.isDuplicate).toBe(false);
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].source).toBe('USDC');

    // Storage check
    const stored = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].source).toBe('USDC');
  });

  it('guards against double-apply on concurrent or multiple flushes', async () => {
    const flushItem = jest.fn().mockImplementation(async (item: QueuedSwapMutation) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { success: true };
    });

    const { result } = renderHook(() =>
      useOfflineQueue({
        onFlushItem: flushItem,
      })
    );

    act(() => {
      result.current.enqueueMutation({
        source: 'USDC',
        dest: 'EURC',
        amount: '100',
      });
    });

    // Trigger flush twice concurrently
    let p1: Promise<void>;
    let p2: Promise<void>;
    act(() => {
      p1 = result.current.flushQueue();
      p2 = result.current.flushQueue();
    });

    await act(async () => {
      await Promise.all([p1!, p2!]);
    });

    // Should only have executed once, never double-applied
    expect(flushItem).toHaveBeenCalledTimes(1);
    expect(result.current.queue).toHaveLength(0);
  });

  it('surfaces server conflicts on reconcile failure and preserves conflicted item', async () => {
    const flushItem = jest.fn().mockResolvedValue({
      success: false,
      conflictReason: 'Slippage exceeded max allowable',
    });

    const { result } = renderHook(() =>
      useOfflineQueue({
        onFlushItem: flushItem,
      })
    );

    act(() => {
      result.current.enqueueMutation({
        source: 'USDC',
        dest: 'EURC',
        amount: '500',
      });
    });

    await act(async () => {
      await result.current.flushQueue();
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].status).toBe('conflict');
    expect(result.current.conflicts).toHaveLength(1);
    expect(result.current.conflicts[0].reason).toBe('Slippage exceeded max allowable');

    // Can clear conflict
    act(() => {
      result.current.clearConflict(result.current.conflicts[0].id);
    });
    expect(result.current.conflicts).toHaveLength(0);
    expect(result.current.queue).toHaveLength(0);
  });

  it('automatically triggers flush on reconnect when going from offline to online', async () => {
    const flushItem = jest.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useOfflineQueue({
        onFlushItem: flushItem,
      })
    );

    // Go offline and queue
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOffline).toBe(true);

    act(() => {
      result.current.enqueueMutation({
        source: 'XLM',
        dest: 'USDC',
        amount: '250',
      });
    });
    expect(flushItem).not.toHaveBeenCalled();

    // Reconnect -> online event
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOffline).toBe(false);
    expect(flushItem).toHaveBeenCalledTimes(1);
    expect(flushItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'XLM',
        dest: 'USDC',
        amount: '250',
      })
    );
  });
});
