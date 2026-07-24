import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { PairsDrawer } from './PairsDrawer';
import { type Pair } from '@/lib/types';

function TestWrapper() {
  const [activePair, setActivePair] = useState<Pair | null>(null);

  return (
    <div>
      <button
        onClick={() => setActivePair({ source: 'EUR', destination: 'USD' })}
      >
        Open Details
      </button>
      <PairsDrawer pair={activePair} onClose={() => setActivePair(null)} />
    </div>
  );
}

describe('PairsDrawer', () => {
  it('opens with details and closes on Escape', () => {
    render(<TestWrapper />);

    const trigger = screen.getByRole('button', { name: 'Open Details' });
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('traps focus inside the drawer', () => {
    render(<TestWrapper />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Details' }));

    const closeButton = screen.getByRole('button', { name: 'Close details' });
    const panel = screen.getByRole('dialog').firstChild as HTMLElement;

    // Initial focus is on the panel (tabIndex="-1")
    expect(document.activeElement).toBe(panel);

    // Focus the first element inside panel
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    // Tabbing past the last element loops back to the first
    fireEvent.keyDown(panel, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab from first loops to last
    fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(closeButton);
  });

  it('returns focus to the trigger upon closing', () => {
    render(<TestWrapper />);

    const trigger = screen.getByRole('button', { name: 'Open Details' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close details' });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('renders volume formatted compactly with title and aria-label when volume is provided', () => {
    const pair: Pair = { source: 'USDC', destination: 'EURC', volume: 1500000 };
    render(<PairsDrawer pair={pair} onClose={() => {}} />);

    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    const volDisplay = screen.getByText('1.5M');
    expect(volDisplay).toBeInTheDocument();
    expect(volDisplay).toHaveAttribute('title', '1,500,000');
    expect(volDisplay).toHaveAttribute('aria-label', '1,500,000');
  });
});
