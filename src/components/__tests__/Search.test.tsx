import { render, screen, fireEvent } from '@testing-library/react';
import { Search } from '../Search';

describe('Search Component', () => {
  const sampleItems = [
    { id: '1', name: 'Alpha' },
    { id: '2', name: 'Beta' },
    { id: '3', name: 'Gamma' },
  ];

  it('renders input with label and placeholder', () => {
    render(
      <Search
        query=""
        onQueryChange={jest.fn()}
        inputLabel="Search Pairs"
        placeholder="Enter search term…"
      />
    );

    const input = screen.getByRole('combobox', { name: 'Search Pairs' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter search term…');
  });

  it('handles query change events', () => {
    const handleQueryChange = jest.fn();
    render(<Search query="" onQueryChange={handleQueryChange} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'usdc' } });
    expect(handleQueryChange).toHaveBeenCalledWith('usdc');
  });

  it('renders results list when results are provided', () => {
    render(
      <Search
        query="Al"
        onQueryChange={jest.fn()}
        results={sampleItems}
        renderItem={(item) => <span>{item.name}</span>}
        getKey={(item) => item.id}
      />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders distinct loading state when loading is true', () => {
    render(<Search query="test" onQueryChange={jest.fn()} loading />);

    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('renders distinct empty state when results array is empty', () => {
    render(
      <Search
        query="nonexistent"
        onQueryChange={jest.fn()}
        results={[]}
        emptyTitle="No matches found"
        emptyDescription="Try searching for something else."
      />
    );

    expect(screen.getByText('No matches found')).toBeInTheDocument();
    expect(
      screen.getByText('Try searching for something else.')
    ).toBeInTheDocument();
  });

  it('renders default empty description when emptyDescription is omitted and query is empty', () => {
    render(<Search query="" onQueryChange={jest.fn()} results={[]} />);

    expect(screen.getByText('No items available.')).toBeInTheDocument();
  });

  it('renders distinct error state with role=alert and error details', () => {
    render(
      <Search
        query="test"
        onQueryChange={jest.fn()}
        error="Network failure: 500 Internal Server Error"
        errorTitle="Custom Search Error"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Custom Search Error')).toBeInTheDocument();
    expect(
      screen.getByText('Network failure: 500 Internal Server Error')
    ).toBeInTheDocument();

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'search-error-message');
  });

  it('renders retry button and triggers onRetry callback when clicked', () => {
    const handleRetry = jest.fn();
    render(
      <Search
        query="test"
        onQueryChange={jest.fn()}
        error="Failed to connect"
        onRetry={handleRetry}
      />
    );

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('announces search results and state changes via ARIA live region', () => {
    const { rerender } = render(
      <Search
        query="Alpha"
        onQueryChange={jest.fn()}
        results={[{ id: '1', name: 'Alpha' }]}
      />
    );

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveTextContent('Found 1 result for "Alpha".');

    rerender(<Search query="xyz" onQueryChange={jest.fn()} results={[]} />);
    expect(statusRegion).toHaveTextContent('No results found for "xyz".');

    rerender(
      <Search query="xyz" onQueryChange={jest.fn()} error="Connection lost" />
    );
    expect(statusRegion).toHaveTextContent('Search failed: Connection lost');
  });

  it('announces retrying state when retry button is pressed', () => {
    const handleRetry = jest.fn();
    render(
      <Search
        query="test"
        onQueryChange={jest.fn()}
        error="Request timed out"
        onRetry={handleRetry}
      />
    );

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveTextContent('Retrying search…');
  });
});
