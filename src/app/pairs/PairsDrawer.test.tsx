import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PairsDrawer } from './PairsDrawer';
import { type Pair } from '@/lib/types';

function TestWrapper() {
  const [activePair, setActivePair] = useState<Pair | null>(null);

  return (
    <div>
      <button onClick={() => setActivePair({ source: 'EUR', destination: 'USD' })}>
        Open Details
      </button>
      <PairsDrawer
        pair={activePair}
        onClose={() => setActivePair(null)}
      />
    </div>
  );
}

describe('PairsDrawer', () => {
  it('opens with details and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const trigger = screen.getByRole('button', { name: 'Open Details' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('traps focus inside the drawer', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    await user.click(screen.getByRole('button', { name: 'Open Details' }));

    const closeButton = screen.getByRole('button', { name: 'Close details' });
    
    // Initial focus is on the panel (tabIndex="-1")
    const panel = screen.getByRole('dialog').firstChild as HTMLElement;
    expect(document.activeElement).toBe(panel);

    // Tab moves to the first focusable element (close button)
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    // Tabbing past the last element loops back to the first
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab from first loops to last
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(closeButton);
  });

  it('returns focus to the trigger upon closing', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const trigger = screen.getByRole('button', { name: 'Open Details' });
    trigger.focus();
    await user.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close details' });
    await user.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});
