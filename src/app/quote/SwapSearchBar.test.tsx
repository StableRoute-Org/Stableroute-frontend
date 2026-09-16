import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwapSearchBar } from './SwapSearchBar';

describe('SwapSearchBar', () => {
  it('renders input with accessible label and placeholder', () => {
    render(
      <SwapSearchBar
        query=""
        onQueryChange={jest.fn()}
        onClear={jest.fn()}
        label="Filter quotes"
        placeholder="Search by asset code"
      />
    );

    const input = screen.getByLabelText('Filter quotes');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search by asset code');
  });

  it('triggers onQueryChange when typing', () => {
    const onQueryChange = jest.fn();
    render(
      <SwapSearchBar
        query=""
        onQueryChange={onQueryChange}
        onClear={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Filter quotes'), {
      target: { value: 'usdc' },
    });
    expect(onQueryChange).toHaveBeenCalledWith('usdc');
  });

  it('shows clear button when query is not empty and clears on click', () => {
    const onClear = jest.fn();
    render(
      <SwapSearchBar query="eurc" onQueryChange={jest.fn()} onClear={onClear} />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear search' });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('clears query on Escape key press when query is not empty', () => {
    const onClear = jest.fn();
    render(
      <SwapSearchBar query="eurc" onQueryChange={jest.fn()} onClear={onClear} />
    );

    fireEvent.keyDown(screen.getByLabelText('Filter quotes'), {
      key: 'Escape',
      code: 'Escape',
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('displays loading indicator and aria-busy when isLoading is true', () => {
    render(
      <SwapSearchBar
        query="usdc"
        onQueryChange={jest.fn()}
        onClear={jest.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('search-loading-indicator')).toHaveTextContent(
      'Searching…'
    );
    expect(screen.getByLabelText('Filter quotes')).toHaveAttribute(
      'aria-busy',
      'true'
    );
    expect(screen.getByText('Searching quotes…')).toBeInTheDocument();
  });

  it('renders distinct error state with retry button', () => {
    const onRetry = jest.fn();
    render(
      <SwapSearchBar
        query="usdc"
        onQueryChange={jest.fn()}
        onClear={jest.fn()}
        isError={true}
        errorMessage="Network connection timed out"
        onRetry={onRetry}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Network connection timed out');
    expect(screen.getByLabelText('Filter quotes')).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('announces search result counts in live region', () => {
    const { rerender } = render(
      <SwapSearchBar
        query="usdc"
        onQueryChange={jest.fn()}
        onClear={jest.fn()}
        resultsCount={3}
      />
    );

    expect(
      screen.getByText('Found 3 quotes matching "usdc".')
    ).toBeInTheDocument();

    rerender(
      <SwapSearchBar
        query="usdc"
        onQueryChange={jest.fn()}
        onClear={jest.fn()}
        resultsCount={1}
      />
    );
    expect(
      screen.getByText('Found 1 quote matching "usdc".')
    ).toBeInTheDocument();

    rerender(
      <SwapSearchBar
        query="unknown"
        onQueryChange={jest.fn()}
        onClear={jest.fn()}
        resultsCount={0}
      />
    );
    expect(screen.getByText('No quotes match "unknown".')).toBeInTheDocument();
  });
});
