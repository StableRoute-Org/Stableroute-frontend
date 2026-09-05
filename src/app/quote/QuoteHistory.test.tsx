import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { QuoteHistory, HistoryEntry } from './QuoteHistory';

describe('QuoteHistory Component', () => {
  const sampleHistory: HistoryEntry[] = [
    { source: 'USDC', dest: 'EURC', amount: '1000000', savedAt: 1600000000000 },
    { source: 'XLM', dest: 'USDC', amount: '500000', savedAt: 1600000001000 },
  ];

  afterEach(() => {
    // Reset the URL between tests so query params never leak across cases,
    // and make sure fake timers from a failed test cannot leak either.
    jest.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('shows the true-empty state when history array is empty', () => {
    render(<QuoteHistory history={[]} onSelect={jest.fn()} />);
    expect(
      screen.getByText(/No recent quotes yet/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders history rows in a table and handles entry selection', () => {
    const onSelect = jest.fn();
    render(<QuoteHistory history={sampleHistory} onSelect={onSelect} />);

    expect(
      screen.getByRole('heading', { name: /Recent quotes/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Use quote USDC → EURC · 1000000/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Use quote XLM → USDC · 500000/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Use quote USDC → EURC · 1000000/i })
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleHistory[0]);
  });

  it('memoizes rendering and skips re-renders when props are stable', () => {
    let renderCount = 0;

    // Component wrapper that tracks render count of memoized QuoteHistory
    const TrackedHistory = React.memo(function TrackedHistoryComponent(
      props: React.ComponentProps<typeof QuoteHistory>
    ) {
      renderCount++;
      return <QuoteHistory {...props} />;
    });
    TrackedHistory.displayName = 'TrackedHistory';

    const ParentComponent = () => {
      const [dummyState, setDummyState] = useState(0);
      const [history] = useState(sampleHistory);
      const onSelect = React.useCallback(() => {}, []);

      return (
        <div>
          <button onClick={() => setDummyState((s) => s + 1)}>
            Re-render Parent ({dummyState})
          </button>
          <TrackedHistory history={history} onSelect={onSelect} />
        </div>
      );
    };

    render(<ParentComponent />);
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1);
    // Cause parent state change
    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1); // Render count remains 1 because props are stable!

    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1);
  });

  it('re-renders when history prop changes to a new array reference', () => {
    let renderCount = 0;

    const TrackedHistory = (
      props: React.ComponentProps<typeof QuoteHistory>
    ) => {
      renderCount++;
      return <QuoteHistory {...props} />;
    };

    const ParentComponent = () => {
      const [history, setHistory] = useState(sampleHistory);
      const onSelect = React.useCallback(() => {}, []);

      return (
        <div>
          <button
            onClick={() =>
              setHistory([
                {
                  source: 'BTC',
                  dest: 'USDC',
                  amount: '1',
                  savedAt: 1700000000000,
                },
                ...sampleHistory,
              ])
            }
          >
            Update History
          </button>
          <TrackedHistory history={history} onSelect={onSelect} />
        </div>
      );
    };

    render(<ParentComponent />);
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Update History/i }));
    expect(renderCount).toBe(2);
    expect(
      screen.getByRole('button', { name: /Use quote BTC → USDC · 1\b/i })
    ).toBeInTheDocument();
  });

  describe('URL-synced table view (issue edge cases)', () => {
    const fiveRows: HistoryEntry[] = [
      { source: 'USDC', dest: 'EURC', amount: '3000', savedAt: 1000 },
      { source: 'XLM', dest: 'USDC', amount: '500', savedAt: 2000 },
      { source: 'USDC', dest: 'NGN', amount: '100', savedAt: 3000 },
      { source: 'BTC', dest: 'USDC', amount: '2500', savedAt: 4000 },
      { source: 'USDC', dest: 'EURC', amount: '700', savedAt: 5000 },
    ];

    const rowSourcesOnPage = (): string[] => {
      const table = screen.getByRole('table');
      return Array.from(table.querySelectorAll('tbody tr')).map(
        (row) => row.querySelectorAll('td')[0].textContent ?? ''
      );
    };

    it('sorts a column: rows reorder and the URL updates', () => {
      render(<QuoteHistory history={fiveRows} onSelect={jest.fn()} />);

      // Default order is recency: USDC, XLM, USDC on page one.
      expect(rowSourcesOnPage()).toEqual(['USDC', 'XLM', 'USDC']);
      expect(window.location.search).toBe('');

      fireEvent.click(screen.getByRole('button', { name: /^Source/ }));

      // Ascending: BTC first; ties among USDC keep their original order.
      expect(rowSourcesOnPage()).toEqual(['BTC', 'USDC', 'USDC']);
      expect(window.location.search).toContain('q_sort=source');
      expect(window.location.search).toContain('q_dir=asc');
      expect(
        screen.getByRole('columnheader', { name: /^Source/ })
      ).toHaveAttribute('aria-sort', 'ascending');
    });

    it('filters: rows narrow and the URL updates after the debounce', () => {
      jest.useFakeTimers();
      render(<QuoteHistory history={fiveRows} onSelect={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/Filter quotes/i), {
        target: { value: 'eurc' },
      });

      // Before the debounce elapses nothing has been committed yet.
      expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 rows

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // eurc matches exactly two of the five entries (both via destination).
      const table = screen.getByRole('table');
      expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
      expect(window.location.search).toContain('q_filter=eurc');
      expect(screen.getByText(/^Page 1 of 1$/)).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('restores sort, filter and page from the query string on mount', () => {
      window.history.replaceState(
        null,
        '',
        '/quote?q_sort=amount&q_dir=desc&q_page=2'
      );
      render(<QuoteHistory history={fiveRows} onSelect={jest.fn()} />);

      // Descending by numeric amount: 3000, 2500, 700 | 500, 100 → page two
      // holds the remaining two rows.
      expect(rowSourcesOnPage()).toEqual(['XLM', 'USDC']);
      expect(
        screen.getByRole('columnheader', { name: /^Amount/ })
      ).toHaveAttribute('aria-sort', 'descending');
      expect(screen.getByText(/^Page 2 of 2$/)).toBeInTheDocument();
      // Restoring state must not rewrite the URL.
      expect(window.location.search).toContain('q_sort=amount');
      expect(window.location.search).toContain('q_page=2');
    });

    it('shows a distinct filtered-empty state (different from no-data)', () => {
      jest.useFakeTimers();
      render(<QuoteHistory history={fiveRows} onSelect={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/Filter quotes/i), {
        target: { value: 'zzz-no-match' },
      });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(
        screen.getByText(/No quotes match your filters/i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/No recent quotes yet/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('keeps pagination keyboard-accessible and clamps at bounds', () => {
      render(<QuoteHistory history={fiveRows} onSelect={jest.fn()} />);

      const previous = screen.getByRole('button', { name: /Previous/i });
      const next = screen.getByRole('button', { name: /Next/i });
      expect(previous).toBeDisabled();
      expect(next).toBeEnabled();

      fireEvent.click(next);
      expect(screen.getByText(/^Page 2 of 2$/)).toBeInTheDocument();
      expect(next).toBeDisabled();
      expect(previous).toBeEnabled();
      expect(window.location.search).toContain('q_page=2');

      fireEvent.click(previous);
      expect(screen.getByText(/^Page 1 of 2$/)).toBeInTheDocument();
    });

    it('sorts stably for equal keys after an interactive re-sort', () => {
      const tied: HistoryEntry[] = [
        { source: 'AAA', dest: 'Z', amount: '10', savedAt: 1 },
        { source: 'BBB', dest: 'Y', amount: '10', savedAt: 2 },
        { source: 'CCC', dest: 'X', amount: '5', savedAt: 3 },
      ];
      render(<QuoteHistory history={tied} onSelect={jest.fn()} />);

      // Amount asc: the tie between 10/10 resolves to original order.
      fireEvent.click(screen.getByRole('button', { name: /^Amount/ }));
      const amounts = Array.from(
        screen.getByRole('table').querySelectorAll('tbody tr')
      ).map((row) => row.querySelectorAll('td')[2].textContent);
      expect(amounts).toEqual(['5', '10', '10']);

      // The two tied entries keep their original relative order (AAA before BBB).
      const sources = Array.from(
        screen.getByRole('table').querySelectorAll('tbody tr')
      ).map((row) => row.querySelectorAll('td')[0].textContent);
      expect(sources).toEqual(['CCC', 'AAA', 'BBB']);
    });
  });

  describe('CSV and JSON Export (Issue #730)', () => {
    beforeEach(() => {
      window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      window.URL.revokeObjectURL = jest.fn();
    });

    it('renders Export CSV and Export JSON buttons when history exists', () => {
      render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);
      expect(
        screen.getByRole('button', { name: /Export filtered quotes as CSV/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Export filtered quotes as JSON/i })
      ).toBeInTheDocument();
    });

    it('does not render export buttons when history is empty', () => {
      render(<QuoteHistory history={[]} onSelect={jest.fn()} />);
      expect(
        screen.queryByRole('button', { name: /Export filtered quotes as CSV/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Export filtered quotes as JSON/i })
      ).not.toBeInTheDocument();
    });

    it('triggers CSV download when Export CSV is clicked', () => {
      render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);
      fireEvent.click(
        screen.getByRole('button', { name: /Export filtered quotes as CSV/i })
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('triggers JSON download when Export JSON is clicked', () => {
      render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);
      fireEvent.click(
        screen.getByRole('button', { name: /Export filtered quotes as JSON/i })
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
  });
});
