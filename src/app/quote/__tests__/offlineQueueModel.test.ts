import {
  loadOfflineQueue,
  saveOfflineQueue,
  enqueueMutationPure,
  getPendingFlushes,
  markFlushingPure,
  reconcileMutationPure,
  purgeReconciledPure,
  OFFLINE_QUEUE_KEY,
  type QueuedSwapMutation,
} from '../offlineQueueModel';

describe('offlineQueueModel Pure Unit Tests (#729)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads empty array when storage is empty or invalid JSON', () => {
    expect(loadOfflineQueue()).toEqual([]);

    localStorage.setItem(OFFLINE_QUEUE_KEY, 'invalid-json{{{');
    expect(loadOfflineQueue()).toEqual([]);

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify({ notAnArray: true }));
    expect(loadOfflineQueue()).toEqual([]);
  });

  it('saves and restores queued mutations correctly', () => {
    const items: QueuedSwapMutation[] = [
      {
        id: 'q1',
        source: 'USDC',
        dest: 'EURC',
        amount: '1000',
        timestamp: 100,
        status: 'queued',
      },
    ];

    saveOfflineQueue(items);
    const restored = loadOfflineQueue();
    expect(restored).toEqual(items);
  });

  it('enqueues mutations and maintains chronological FIFO ordering', () => {
    const { queue: q1 } = enqueueMutationPure([], {
      source: 'USDC',
      dest: 'EURC',
      amount: '500',
      timestamp: 200,
    });
    const { queue: q2 } = enqueueMutationPure(q1, {
      source: 'XLM',
      dest: 'USDC',
      amount: '300',
      timestamp: 100, // Earlier timestamp
    });

    expect(q2).toHaveLength(2);
    // Should be sorted by timestamp asc
    expect(q2[0].source).toBe('XLM');
    expect(q2[1].source).toBe('USDC');
  });

  it('deduplicates identical pending mutations for idempotency', () => {
    const { queue: q1 } = enqueueMutationPure([], {
      source: 'usdc ',
      dest: ' eurc',
      amount: ' 1000 ',
      timestamp: 100,
    });

    const { queue: q2, isDuplicate, item } = enqueueMutationPure(q1, {
      source: 'USDC',
      dest: 'EURC',
      amount: '1000',
      timestamp: 200,
    });

    expect(isDuplicate).toBe(true);
    expect(q2).toHaveLength(1);
    expect(item.id).toBe(q1[0].id);
  });

  it('transitions mutations through flushing, reconciliation, and purge', () => {
    const m1: QueuedSwapMutation = {
      id: 'm1',
      source: 'USDC',
      dest: 'EURC',
      amount: '100',
      timestamp: 10,
      status: 'queued',
    };
    const m2: QueuedSwapMutation = {
      id: 'm2',
      source: 'BTC',
      dest: 'ETH',
      amount: '200',
      timestamp: 20,
      status: 'queued',
    };

    const initial = [m1, m2];
    expect(getPendingFlushes(initial)).toHaveLength(2);

    // Mark flushing
    const flushing = markFlushingPure(initial, ['m1']);
    expect(flushing[0].status).toBe('flushing');
    expect(flushing[1].status).toBe('queued');

    // Reconcile success for m1, conflict for m2
    let reconciled = reconcileMutationPure(flushing, 'm1', { success: true });
    reconciled = reconcileMutationPure(reconciled, 'm2', {
      success: false,
      conflictReason: 'Slippage exceeded tolerance',
    });

    expect(reconciled[0].status).toBe('reconciled');
    expect(reconciled[1].status).toBe('conflict');
    expect(reconciled[1].conflictReason).toBe('Slippage exceeded tolerance');

    // Purge completed
    const purged = purgeReconciledPure(reconciled);
    expect(purged).toHaveLength(1);
    expect(purged[0].id).toBe('m2');
  });
});
