import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwapModal } from './SwapModal';
import type { Quote } from '@/lib/types';

const mockQuote: Quote = {
  source_asset: 'USDC',
  dest_asset: 'EURC',
  amount: '1000000',
  estimated_rate: '0.92',
  route: ['USDC', 'EURC'],
};

describe('SwapModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <SwapModal
        quote={mockQuote}
        open={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders accessible name and details when open', () => {
    render(
      <SwapModal
        quote={mockQuote}
        open={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    const dialog = screen.getByRole('dialog', { name: 'Review swap details' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('USDC → EURC')).toBeInTheDocument();
  });

  it('initially focuses the first focusable element (Cancel button)', async () => {
    // In jsdom offsetParent is null, so we must rely on fallback from useFocusTrap if NODE_ENV=test
    render(
      <SwapModal
        quote={mockQuote}
        open={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
  });

  it('traps Tab focus to wrap within the modal', async () => {
    const user = userEvent.setup();
    render(
      <SwapModal
        quote={mockQuote}
        open={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const confirmBtn = screen.getByRole('button', { name: 'Confirm Swap' });

    await waitFor(() => expect(cancelBtn).toHaveFocus());

    // Tab from Cancel -> Confirm
    await user.tab();
    expect(confirmBtn).toHaveFocus();

    // Tab from Confirm -> wraps to Cancel
    await user.tab();
    expect(cancelBtn).toHaveFocus();

    // Shift+Tab from Cancel -> Confirm
    await user.tab({ shift: true });
    expect(confirmBtn).toHaveFocus();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <SwapModal
        quote={mockQuote}
        open={true}
        onClose={onClose}
        onConfirm={jest.fn()}
      />
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <SwapModal
        quote={mockQuote}
        open={true}
        onClose={onClose}
        onConfirm={jest.fn()}
      />
    );

    const overlay = screen.getByRole('dialog');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Ensure clicking inside the panel doesn't close it
    const panel = screen.getByRole('heading', {
      name: 'Review swap details',
    }).parentElement!;
    onClose.mockClear();
    await user.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});
