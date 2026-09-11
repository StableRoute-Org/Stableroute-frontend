import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QueuedSwapMutation,
  loadOfflineQueue,
  saveOfflineQueue,
  enqueueMutationPure,
  getPendingFlushes,
  markFlushingPure,
  reconcileMutationPure,
  purgeReconciledPure,
} from './offlineQueueModel';

export interface UseOfflineQueueOptions {
  onFlushItem?: (
    item: QueuedSwapMutation
  ) => Promise<{ success: boolean; conflictReason?: string; result?: any }>;
}

export interface OfflineConflict {
  id: string;
  source: string;
  dest: string;
  amount: string;
  reason: string;
}

export function useOfflineQueue(options?: UseOfflineQueueOptions) {
  const [isOffline, setIsOffline] = useState(false);
  const [queue, setQueue] = useState<QueuedSwapMutation[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);
  
  const isFlushingRef = useRef(false);
  const flushingIdsRef = useRef<Set<string>>(new Set());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize network status & load stored queue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
      const loaded = loadOfflineQueue();
      setQueue(loaded);

      // Hydrate existing conflicts from stored queue
      const existingConflicts = loaded
        .filter((m) => m.status === 'conflict' && m.conflictReason)
        .map((m) => ({
          id: m.id,
          source: m.source,
          dest: m.dest,
          amount: m.amount,
          reason: m.conflictReason!,
        }));
      setConflicts(existingConflicts);

      const handleOnline = () => {
        setIsOffline(false);
      };

      const handleOffline = () => {
        setIsOffline(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Helper to update state and persist
  const updateQueue = useCallback(
    (updater: (prev: QueuedSwapMutation[]) => QueuedSwapMutation[]) => {
      setQueue((prev) => {
        const next = updater(prev);
        saveOfflineQueue(next);
        return next;
      });
    },
    []
  );

  const enqueueMutation = useCallback(
    (input: { source: string; dest: string; amount: string; id?: string; timestamp?: number }) => {
      let enqueuedItem: QueuedSwapMutation | null = null;
      let isDup = false;

      updateQueue((prev) => {
        const res = enqueueMutationPure(prev, input);
        enqueuedItem = res.item;
        isDup = res.isDuplicate;
        return res.queue;
      });

      return { item: enqueuedItem!, isDuplicate: isDup };
    },
    [updateQueue]
  );

  const flushQueue = useCallback(
    async (
      customFlushFn?: (
        item: QueuedSwapMutation
      ) => Promise<{ success: boolean; conflictReason?: string; result?: any }>
    ) => {
      // Guard against concurrent execution (double-apply protection)
      if (isFlushingRef.current) {
        return;
      }

      const flushFn = customFlushFn || optionsRef.current?.onFlushItem;
      if (!flushFn) return;

      isFlushingRef.current = true;
      setIsFlushing(true);

      try {
        const currentQueue = loadOfflineQueue();
        const pending = getPendingFlushes(currentQueue).filter(
          (m) => !flushingIdsRef.current.has(m.id)
        );

        if (pending.length === 0) {
          return;
        }

        // Mark as flushing to prevent any duplicate concurrent flush
        pending.forEach((m) => flushingIdsRef.current.add(m.id));
        updateQueue((prev) => markFlushingPure(prev, pending.map((m) => m.id)));

        for (const item of pending) {
          try {
            const res = await flushFn(item);
            if (res.success) {
              updateQueue((prev) =>
                purgeReconciledPure(reconcileMutationPure(prev, item.id, { success: true }))
              );
            } else {
              const reason = res.conflictReason || 'Server conflict';
              updateQueue((prev) =>
                reconcileMutationPure(prev, item.id, {
                  success: false,
                  conflictReason: reason,
                })
              );
              setConflicts((prev) => [
                ...prev.filter((c) => c.id !== item.id),
                {
                  id: item.id,
                  source: item.source,
                  dest: item.dest,
                  amount: item.amount,
                  reason,
                },
              ]);
            }
          } catch (err: any) {
            const reason = err?.message || 'Flush network error';
            updateQueue((prev) =>
              reconcileMutationPure(prev, item.id, {
                success: false,
                conflictReason: reason,
              })
            );
            setConflicts((prev) => [
              ...prev.filter((c) => c.id !== item.id),
              {
                id: item.id,
                source: item.source,
                dest: item.dest,
                amount: item.amount,
                reason,
              },
            ]);
          } finally {
            flushingIdsRef.current.delete(item.id);
          }
        }
      } finally {
        isFlushingRef.current = false;
        setIsFlushing(false);
      }
    },
    [updateQueue]
  );

  // Automatically flush on reconnect when going from offline to online
  useEffect(() => {
    if (!isOffline && optionsRef.current?.onFlushItem) {
      flushQueue();
    }
  }, [isOffline, flushQueue]);

  const clearConflict = useCallback(
    (id: string) => {
      setConflicts((prev) => prev.filter((c) => c.id !== id));
      updateQueue((prev) => prev.filter((m) => m.id !== id));
    },
    [updateQueue]
  );

  const clearAll = useCallback(() => {
    setConflicts([]);
    updateQueue(() => []);
  }, [updateQueue]);

  return {
    isOffline,
    setIsOffline,
    queue,
    isFlushing,
    conflicts,
    enqueueMutation,
    flushQueue,
    clearConflict,
    clearAll,
  };
}
