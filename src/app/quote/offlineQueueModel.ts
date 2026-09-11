/**
 * Pure data model and storage operations for offline swap interface mutations (#729).
 */

export interface QueuedSwapMutation {
  id: string;
  source: string;
  dest: string;
  amount: string;
  timestamp: number;
  status: 'queued' | 'flushing' | 'reconciled' | 'conflict';
  conflictReason?: string;
}

export const OFFLINE_QUEUE_KEY = 'stableroute.quote.offline_queue';

/**
 * Loads queued swap mutations safely from storage.
 */
export function loadOfflineQueue(storage?: Storage): QueuedSwapMutation[] {
  if (typeof window === 'undefined' && !storage) return [];
  const store = storage ?? window.localStorage;
  try {
    const raw = store.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QueuedSwapMutation =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.source === 'string' &&
        typeof item.dest === 'string' &&
        typeof item.amount === 'string' &&
        typeof item.timestamp === 'number' &&
        ['queued', 'flushing', 'reconciled', 'conflict'].includes(item.status)
    );
  } catch {
    return [];
  }
}

/**
 * Persists queued swap mutations to storage.
 */
export function saveOfflineQueue(
  queue: QueuedSwapMutation[],
  storage?: Storage
): void {
  if (typeof window === 'undefined' && !storage) return;
  const store = storage ?? window.localStorage;
  try {
    store.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage quota or disabled storage fallback
  }
}

/**
 * Adds a new mutation to the queue with idempotency:
 * If an identical pending mutation (same source, dest, amount) already exists in 'queued' status,
 * it returns the existing queue without duplicating.
 */
export function enqueueMutationPure(
  queue: QueuedSwapMutation[],
  input: { source: string; dest: string; amount: string; id?: string; timestamp?: number }
): { queue: QueuedSwapMutation[]; item: QueuedSwapMutation; isDuplicate: boolean } {
  const normSource = input.source.trim().toUpperCase();
  const normDest = input.dest.trim().toUpperCase();
  const normAmount = input.amount.trim();

  // Check for duplicate pending mutation
  const existing = queue.find(
    (m) =>
      m.status === 'queued' &&
      m.source === normSource &&
      m.dest === normDest &&
      m.amount === normAmount
  );

  if (existing) {
    return { queue, item: existing, isDuplicate: true };
  }

  const newItem: QueuedSwapMutation = {
    id: input.id ?? `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: normSource,
    dest: normDest,
    amount: normAmount,
    timestamp: input.timestamp ?? Date.now(),
    status: 'queued',
  };

  const nextQueue = [...queue, newItem].sort((a, b) => a.timestamp - b.timestamp);
  return { queue: nextQueue, item: newItem, isDuplicate: false };
}

/**
 * Returns pending mutations ready for flushing.
 */
export function getPendingFlushes(queue: QueuedSwapMutation[]): QueuedSwapMutation[] {
  return queue
    .filter((m) => m.status === 'queued')
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Marks specific mutations as currently flushing to prevent double-application.
 */
export function markFlushingPure(
  queue: QueuedSwapMutation[],
  idsToFlush: string[]
): QueuedSwapMutation[] {
  const idSet = new Set(idsToFlush);
  return queue.map((m) =>
    idSet.has(m.id) && m.status === 'queued' ? { ...m, status: 'flushing' as const } : m
  );
}

/**
 * Updates a mutation status after flush resolution (success or conflict).
 */
export function reconcileMutationPure(
  queue: QueuedSwapMutation[],
  id: string,
  result: { success: boolean; conflictReason?: string }
): QueuedSwapMutation[] {
  return queue.map((m) => {
    if (m.id !== id) return m;
    if (result.success) {
      return { ...m, status: 'reconciled' as const };
    }
    return {
      ...m,
      status: 'conflict' as const,
      conflictReason: result.conflictReason ?? 'Server rejected quote parameters',
    };
  });
}

/**
 * Removes reconciled mutations from the queue while keeping active and conflicted ones.
 */
export function purgeReconciledPure(queue: QueuedSwapMutation[]): QueuedSwapMutation[] {
  return queue.filter((m) => m.status !== 'reconciled');
}
