import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteHistory, type HistoryEntry } from '../QuoteHistory';

describe('QuoteHistory Roving Tabindex Integration (#732)', () => {
  const sampleHistory: HistoryEntry[] = [
    { source: 'USDC', dest: 'EURC', amount: '1000', savedAt: 1000 },
    { source: 'XLM', dest: 'USDC', amount: '2000', savedAt: 2000 },
    { source: 'BTC', dest: 'ETH', amount: '3000', savedAt: 3000 },
  ];

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('enters the list at exactly one item (only first row has tabindex=0, others have -1)', () => {
    render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);

    const buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    expect(buttons).toHaveLength(3);

    // Exactly one tab stop for the composite list
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
    expect(buttons[1]).toHaveAttribute('tabindex', '-1');
    expect(buttons[2]).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus across items using ArrowDown and ArrowUp', () => {
    render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);

    const buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);

    // ArrowDown moves to second item
    fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');
    expect(buttons[1]).toHaveAttribute('tabindex', '0');

    // ArrowDown moves to third item
    fireEvent.keyDown(buttons[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]).toHaveAttribute('tabindex', '0');

    // ArrowUp returns to second item
    fireEvent.keyDown(buttons[2], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[1]).toHaveAttribute('tabindex', '0');
  });

  it('jumps directly to first and last items using Home and End keys', () => {
    render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);

    const buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    buttons[0].focus();

    // End jumps to last item
    fireEvent.keyDown(buttons[0], { key: 'End' });
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]).toHaveAttribute('tabindex', '0');
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');

    // Home jumps back to first item
    fireEvent.keyDown(buttons[2], { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
  });

  it('activates the focused item and calls onSelect with the selected entry on Enter and Space', () => {
    const onSelect = jest.fn();
    render(<QuoteHistory history={sampleHistory} onSelect={onSelect} />);

    const buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    buttons[1].focus();

    // Enter activates row index 1 (XLM -> USDC)
    fireEvent.keyDown(buttons[1], { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleHistory[1]);

    // Space activates row index 1
    fireEvent.keyDown(buttons[1], { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith(sampleHistory[1]);
  });

  it('maintains visible focus rings with high contrast outline styling', () => {
    render(<QuoteHistory history={sampleHistory} onSelect={jest.fn()} />);

    const buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    buttons.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:outline');
      expect(btn.className).toContain('focus-visible:outline-2');
    });
  });

  it('syncs roving tabindex when moving across pages', () => {
    const multiPageHistory: HistoryEntry[] = [
      { source: 'A', dest: 'B', amount: '1', savedAt: 1 },
      { source: 'C', dest: 'D', amount: '2', savedAt: 2 },
      { source: 'E', dest: 'F', amount: '3', savedAt: 3 },
      { source: 'G', dest: 'H', amount: '4', savedAt: 4 },
      { source: 'I', dest: 'J', amount: '5', savedAt: 5 },
    ];
    render(<QuoteHistory history={multiPageHistory} onSelect={jest.fn()} />);

    // Page 1 has 3 items
    const page1Buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    expect(page1Buttons).toHaveLength(3);
    expect(page1Buttons[0]).toHaveAttribute('tabindex', '0');

    // Click Next
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Page 2 has 2 items
    const page2Buttons = screen.getAllByRole('button', { name: /^Use quote /i });
    expect(page2Buttons).toHaveLength(2);
    expect(page2Buttons[0]).toHaveAttribute('tabindex', '0');
    expect(page2Buttons[1]).toHaveAttribute('tabindex', '-1');
  });
});
