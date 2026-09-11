import {
  swapAsyncReducer,
  INITIAL_SWAP_STATE,
  formatSwapError,
  type SwapAsyncState,
} from '../swapStateMachine';
import type { Quote } from '@/lib/types';

const MOCK_QUOTE: Quote = {
  source_asset: 'USDC',
  dest_asset: 'EURC',
  amount: '1000000',
  estimated_rate: '1.08',
  route: ['USDC', 'EURC'],
};

describe('swapAsyncReducer', () => {
  it('starts in empty state by default', () => {
    expect(INITIAL_SWAP_STATE).toEqual({ status: 'empty' });
  });

  it('SUBMIT_START transitions to loading from any state', () => {
    const fromEmpty = swapAsyncReducer(INITIAL_SWAP_STATE, { type: 'SUBMIT_START' });
    expect(fromEmpty).toEqual({ status: 'loading' });

    const errorState: SwapAsyncState = {
      status: 'error',
      message: 'Failed to fetch',
    };
    const fromError = swapAsyncReducer(errorState, { type: 'SUBMIT_START' });
    expect(fromError).toEqual({ status: 'loading' });

    const successState: SwapAsyncState = {
      status: 'success',
      quote: MOCK_QUOTE,
    };
    const fromSuccess = swapAsyncReducer(successState, { type: 'SUBMIT_START' });
    expect(fromSuccess).toEqual({ status: 'loading' });
  });

  it('SUBMIT_SUCCESS transitions to success with quote payload', () => {
    const loadingState: SwapAsyncState = { status: 'loading' };
    const nextState = swapAsyncReducer(loadingState, {
      type: 'SUBMIT_SUCCESS',
      quote: MOCK_QUOTE,
    });
    expect(nextState).toEqual({
      status: 'success',
      quote: MOCK_QUOTE,
    });
  });

  it('SUBMIT_ERROR transitions to error with message and requestId', () => {
    const loadingState: SwapAsyncState = { status: 'loading' };
    const nextState = swapAsyncReducer(loadingState, {
      type: 'SUBMIT_ERROR',
      message: 'No route found',
      requestId: 'req-123',
    });
    expect(nextState).toEqual({
      status: 'error',
      message: 'No route found',
      requestId: 'req-123',
    });
  });

  it('RESET transitions back to empty', () => {
    const successState: SwapAsyncState = {
      status: 'success',
      quote: MOCK_QUOTE,
    };
    const nextState = swapAsyncReducer(successState, { type: 'RESET' });
    expect(nextState).toEqual({ status: 'empty' });
  });
});

describe('formatSwapError', () => {
  it('formats an ApiError with requestId correctly', () => {
    const formatted = formatSwapError({
      message: 'Insufficient liquidity',
      requestId: 'req-abc-999',
    });
    expect(formatted).toEqual({
      message: 'Insufficient liquidity',
      requestId: 'req-abc-999',
    });
  });

  it('handles null/undefined gracefully', () => {
    const formatted = formatSwapError(null);
    expect(formatted.message).toMatch(/unexpected error/i);
    expect(formatted.requestId).toBeUndefined();
  });
});
