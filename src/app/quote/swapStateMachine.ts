import type { Quote } from '@/lib/types';
import type { ApiError } from '@/lib/apiClient';

/**
 * Mutually exclusive async states for the swap/quote interface.
 * Discriminated union by `status` prevents impossible states
 * (e.g. rendering an error behind data, or showing loading while displaying an error).
 */
export type SwapAsyncState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'error'; message: string; requestId?: string | null }
  | { status: 'success'; quote: Quote };

export type SwapAsyncAction =
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; quote: Quote }
  | { type: 'SUBMIT_ERROR'; message: string; requestId?: string | null }
  | { type: 'RESET' };

export const INITIAL_SWAP_STATE: SwapAsyncState = { status: 'empty' };

/**
 * Pure state reducer ensuring deterministic transitions.
 * - Any submit start or retry unconditionally resets status to 'loading'.
 * - Errors and quotes are isolated to their respective states.
 */
export function swapAsyncReducer(
  state: SwapAsyncState,
  action: SwapAsyncAction
): SwapAsyncState {
  switch (action.type) {
    case 'SUBMIT_START':
      return { status: 'loading' };
    case 'SUBMIT_SUCCESS':
      return { status: 'success', quote: action.quote };
    case 'SUBMIT_ERROR':
      return {
        status: 'error',
        message: action.message,
        requestId: action.requestId ?? null,
      };
    case 'RESET':
      return { status: 'empty' };
    default:
      return state;
  }
}

/**
 * Normalizes an unknown error into structured message and optional requestId.
 */
export function formatSwapError(err: unknown): {
  message: string;
  requestId?: string | null;
} {
  if (!err) {
    return { message: 'An unexpected error occurred. Please try again.' };
  }
  const apiErr = err as ApiError & { requestId?: string; message?: string };
  return {
    message: apiErr.message || 'Quote request failed. Please try again.',
    requestId: apiErr.requestId ?? null,
  };
}
