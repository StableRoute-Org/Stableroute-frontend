import { render, screen, fireEvent } from '@testing-library/react';
import { SlippageView } from './Slippage';

describe('SlippageView', () => {
  test('renders empty state', () => {
    render(<SlippageView status="empty" />);
    expect(screen.getByTestId('slippage-status')).toHaveTextContent('No slippage data');
  });

  test('renders loading state', () => {
    render(<SlippageView status="loading" />);
    expect(screen.getByTestId('slippage-status')).toHaveTextContent('Calculating slippage…');
  });

  test('renders success state with slippage', () => {
    render(<SlippageView status="success" slippage="0.42%" />);
    expect(screen.getByTestId('slippage-status')).toHaveTextContent('Slippage: 0.42%');
  });

  test('renders error state with retry button', () => {
    const onRetry = jest.fn();
    render(<SlippageView status="error" errorMessage="Network error" onRetry={onRetry} />);
    expect(screen.getByTestId('slippage-status')).toHaveTextContent('Error: Network error');
    const btn = screen.getByRole('button', { name: /try again/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
