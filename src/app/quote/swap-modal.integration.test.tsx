import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteClient from './Client';
import { apiFetch } from '@/lib/apiClient';

jest.mock('@/lib/apiClient');
const mockApiFetch = apiFetch as jest.Mock;

describe('Swap Modal Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // clear localStorage
    window.localStorage.clear();
  });

  it('submits quote, opens review modal, traps focus, and confirms', async () => {
    mockApiFetch.mockResolvedValueOnce({
      source_asset: 'USDC',
      dest_asset: 'EURC',
      amount: '1000',
      estimated_rate: '0.92',
      route: ['USDC', 'EURC'],
    });

    const user = userEvent.setup();
    render(<QuoteClient />);

    // Fill form
    await user.type(screen.getByLabelText('Source asset'), 'USDC');
    await user.type(screen.getByLabelText('Destination asset'), 'EURC');
    await user.type(screen.getByLabelText('Amount (base units)'), '1000');

    // Submit
    await user.click(screen.getByRole('button', { name: 'Get quote' }));

    // Wait for the quote to load and "Review swap" button to appear
    const reviewBtn = await screen.findByRole('button', {
      name: 'Review swap',
    });

    // Click "Review swap"
    await user.click(reviewBtn);

    // Modal should be open
    const dialog = await screen.findByRole('dialog', {
      name: 'Review swap details',
    });
    expect(dialog).toBeInTheDocument();

    // Verify modal content
    expect(within(dialog).getByText('USDC → EURC')).toBeInTheDocument();

    // Focus should be on the first focusable element (Cancel button)
    const cancelBtn = within(dialog).getByRole('button', { name: 'Cancel' });
    const confirmBtn = within(dialog).getByRole('button', {
      name: 'Confirm Swap',
    });

    // Test that focus trap gets applied properly in a test environment
    await waitFor(() => {
      expect(cancelBtn).toHaveFocus();
    });

    // Tab wrapping test inside the modal
    await user.tab();
    expect(confirmBtn).toHaveFocus();

    await user.tab();
    expect(cancelBtn).toHaveFocus();

    await user.tab({ shift: true });
    expect(confirmBtn).toHaveFocus();

    // Confirm the swap
    await user.click(confirmBtn);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Check if the announce was triggered
    expect(screen.getByText('Swap confirmed.')).toBeInTheDocument();
  });
});
