import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRovingTabindex } from '../useRovingTabindex';

interface TestListProps {
  items: string[];
  onActivate?: (index: number) => void;
  loop?: boolean;
}

function TestList({ items, onActivate, loop = false }: TestListProps) {
  const { getItemProps } = useRovingTabindex({
    itemCount: items.length,
    onActivate,
    loop,
  });

  return (
    <div role="list" aria-label="Test composite list">
      {items.map((item, index) => {
        const rovingProps = getItemProps(index);
        return (
          <button
            key={item}
            type="button"
            role="listitem"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            {...rovingProps}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

describe('useRovingTabindex Hook', () => {
  const sampleItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('assigns tabIndex=0 to the first item and tabIndex=-1 to subsequent items', () => {
    render(<TestList items={sampleItems} />);
    const buttons = screen.getAllByRole('listitem');

    expect(buttons[0]).toHaveAttribute('tabindex', '0');
    expect(buttons[1]).toHaveAttribute('tabindex', '-1');
    expect(buttons[2]).toHaveAttribute('tabindex', '-1');
    expect(buttons[3]).toHaveAttribute('tabindex', '-1');
  });

  it('navigates with ArrowDown and ArrowUp updating focus and tabIndex', () => {
    render(<TestList items={sampleItems} />);
    const buttons = screen.getAllByRole('listitem');

    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');
    expect(buttons[1]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(buttons[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[2]);

    fireEvent.keyDown(buttons[2], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('jumps to first and last items on Home and End keys', () => {
    render(<TestList items={sampleItems} />);
    const buttons = screen.getAllByRole('listitem');

    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'End' });
    expect(document.activeElement).toBe(buttons[3]);
    expect(buttons[3]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(buttons[3], { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
  });

  it('activates the item on Enter and Space keys', () => {
    const onActivate = jest.fn();
    render(<TestList items={sampleItems} onActivate={onActivate} />);
    const buttons = screen.getAllByRole('listitem');

    buttons[1].focus();
    fireEvent.keyDown(buttons[1], { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledWith(1);

    fireEvent.keyDown(buttons[1], { key: ' ' });
    expect(onActivate).toHaveBeenCalledWith(1);
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it('syncs activeIndex when an item receives focus directly', () => {
    render(<TestList items={sampleItems} />);
    const buttons = screen.getAllByRole('listitem');

    fireEvent.focus(buttons[2]);
    expect(buttons[2]).toHaveAttribute('tabindex', '0');
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');
  });

  it('clamps bounds at list edges when loop=false', () => {
    render(<TestList items={sampleItems} loop={false} />);
    const buttons = screen.getAllByRole('listitem');

    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.keyDown(buttons[0], { key: 'End' });
    expect(document.activeElement).toBe(buttons[3]);

    fireEvent.keyDown(buttons[3], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[3]);
  });

  it('wraps around at list edges when loop=true', () => {
    render(<TestList items={sampleItems} loop={true} />);
    const buttons = screen.getAllByRole('listitem');

    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[3]);

    fireEvent.keyDown(buttons[3], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('clamps activeIndex when items array shrinks', () => {
    const { rerender } = render(<TestList items={['A', 'B', 'C', 'D']} />);
    const buttons = screen.getAllByRole('listitem');

    fireEvent.focus(buttons[3]);
    expect(buttons[3]).toHaveAttribute('tabindex', '0');

    // Shrink items to 2
    rerender(<TestList items={['A', 'B']} />);
    const remainingButtons = screen.getAllByRole('listitem');
    expect(remainingButtons).toHaveLength(2);
    expect(remainingButtons[1]).toHaveAttribute('tabindex', '0');
  });
});
