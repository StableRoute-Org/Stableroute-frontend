import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SwapResultView } from '../SwapResultView';
import type { Quote } from '@/lib/types';

const MOCK_QUOTE: Quote = {
  source_asset: 'USDC',
  dest_asset: 'EURC',
  amount: '5000000',
  estimated_rate: '1.05',
  route: ['USDC', 'EURC'],
};

describe('SwapResultView — Mutually Exclusive View States', () => {
  it('loading -> shows loader only (no empty, error, or success rendered behind it)', () => {
    render(<SwapResultView state={{ status: 'loading' }} />);

    expect(screen.getByTestId('swap-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('swap-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-success')).not.toBeInTheDocument();

    const loaderStatus = screen.getByRole('status', { name: /requesting quote…/i });
    expect(loaderStatus).toBeInTheDocument();
  });

  it('empty result -> empty state only', () => {
    render(<SwapResultView state={{ status: 'empty' }} />);

    expect(screen.getByTestId('swap-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('swap-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-success')).not.toBeInTheDocument();
    expect(screen.getByText(/no quote requested yet/i)).toBeInTheDocument();
  });

  it('error -> error + retry only', () => {
    const onRetry = jest.fn();
    render(
      <SwapResultView
        state={{
          status: 'error',
          message: 'No available liquidity route',
          requestId: 'req-err-456',
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByTestId('swap-error')).toBeInTheDocument();
    expect(screen.queryByTestId('swap-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-success')).not.toBeInTheDocument();

    expect(screen.getByRole('alert')).toHaveTextContent(/no available liquidity route/i);
    expect(screen.getByText(/req-err-456/)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry quote request/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('success -> content only', () => {
    render(<SwapResultView state={{ status: 'success', quote: MOCK_QUOTE }} />);

    expect(screen.getByTestId('swap-success')).toBeInTheDocument();
    expect(screen.queryByTestId('swap-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();

    expect(screen.getByText('USDC → EURC')).toBeInTheDocument();
  });
});
