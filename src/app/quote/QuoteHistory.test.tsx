import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { QuoteHistory, HistoryEntry } from './QuoteHistory';

describe('QuoteHistory Component', () => {
  const sampleHistory: HistoryEntry[] = [
    { source: 'USDC', dest: 'EURC', amount: '1000000', savedAt: 1600000000000 },
    { source: 'XLM', dest: 'USDC', amount: '500000', savedAt: 1600000001000 },
  ];

  it('renders null when history array is empty', () => {
    const { container } = render(
      <QuoteHistory history={[]} onSelect={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders history items and handles entry selection', () => {
    const onSelect = jest.fn();
    render(<QuoteHistory history={sampleHistory} onSelect={onSelect} />);

    expect(screen.getByRole('heading', { name: /Recent quotes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /USDC → EURC · 1000000/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /XLM → USDC · 500000/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /USDC → EURC · 1000000/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleHistory[0]);
  });

  it('memoizes rendering and skips re-renders when props are stable', () => {
    let renderCount = 0;

    // Component wrapper that tracks render count of memoized QuoteHistory
    const TrackedHistory = React.memo((props: React.ComponentProps<typeof QuoteHistory>) => {
      renderCount++;
      return <QuoteHistory {...props} />;
    });

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

    // Cause parent state change
    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1); // Render count remains 1 because props are stable!

    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1);
  });

  it('re-renders when history prop changes to a new array reference', () => {
    let renderCount = 0;

    const TrackedHistory = (props: React.ComponentProps<typeof QuoteHistory>) => {
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
                { source: 'BTC', dest: 'USDC', amount: '1', savedAt: 1700000000000 },
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
    expect(screen.getByRole('button', { name: /BTC → USDC · 1/i })).toBeInTheDocument();
  });
});
