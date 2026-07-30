import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from '../Tooltip';
import { IconButton } from '../IconButton';

// Helpers
function renderTooltip(content = 'helper text') {
  return render(
    <Tooltip content={content}>
      <button type="button">Trigger</button>
    </Tooltip>
  );
}

/** Advance past the 500 ms default delay so the tooltip becomes visible. */
function advanceDelay() {
  act(() => {
    jest.advanceTimersByTime(500);
  });
}

describe('Tooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the trigger element', () => {
      renderTooltip();
      expect(
        screen.getByRole('button', { name: 'Trigger' })
      ).toBeInTheDocument();
    });

    it('does not render the tooltip popup by default', () => {
      const { container } = renderTooltip();
      // role="tooltip" should not be in the DOM before any interaction
      expect(container.querySelector('[role="tooltip"]')).toBeNull();
    });

    it('renders the tooltip popup after hover with the correct text', () => {
      renderTooltip('helper text');
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.mouseEnter(button);
      advanceDelay();

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('helper text');
    });

    it('accepts a custom delay via the delay prop', () => {
      render(<Tooltip content="slow" delay={1000}><button>Button</button></Tooltip>);
      const button = screen.getByRole('button', { name: 'Button' });

      fireEvent.mouseEnter(button);
      // Advance only 500 ms — default delay, but we set 1000
      act(() => { jest.advanceTimersByTime(500); });
      expect(screen.queryByRole('tooltip')).toBeNull();

      // Now advance the remaining 500 ms
      act(() => { jest.advanceTimersByTime(500); });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('show behaviour (mouseEnter)', () => {
    it('shows the tooltip after the default delay on mouseEnter', () => {
      renderTooltip();
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));

      // Tooltip should not appear before the delay
      expect(screen.queryByRole('tooltip')).toBeNull();

      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('cancels the show timer when the mouse leaves before the delay expires', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      advanceDelay();

      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  describe('show behaviour (focus)', () => {
    it('shows the tooltip when the trigger receives focus', () => {
      renderTooltip();
      fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('shows the tooltip when a child of the wrapper receives focus', () => {
      render(
        <Tooltip content="nested">
          <div>
            <button type="button">Nested button</button>
          </div>
        </Tooltip>
      );
      const button = screen.getByRole('button', { name: 'Nested button' });
      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('hide behaviour (mouseLeave)', () => {
    it('hides the tooltip on mouseLeave after showing', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.mouseEnter(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(button);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  describe('hide behaviour (blur)', () => {
    it('hides the tooltip when the trigger loses focus', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.blur(button);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  describe('hide behaviour (Escape)', () => {
    it('hides the tooltip when Escape is pressed', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(button, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('hides the tooltip when Escape is pressed on a child element', () => {
      render(
        <Tooltip content="nested">
          <div>
            <button type="button">Nested button</button>
          </div>
        </Tooltip>
      );
      const button = screen.getByRole('button', { name: 'Nested button' });

      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(button, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('does not hide on other key presses', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(button, { key: 'Enter' });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('connects the trigger to the tooltip via aria-describedby when visible', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      // Before showing, no aria-describedby
      expect(button).not.toHaveAttribute('aria-describedby');

      fireEvent.focus(button);
      advanceDelay();

      // After showing, aria-describedby points to the tooltip id
      const tooltip = screen.getByRole('tooltip');
      expect(button).toHaveAttribute(
        'aria-describedby',
        tooltip.getAttribute('id')
      );
    });

    it('removes aria-describedby when the tooltip hides', () => {
      renderTooltip();
      const button = screen.getByRole('button', { name: 'Trigger' });

      fireEvent.focus(button);
      advanceDelay();
      expect(button).toHaveAttribute('aria-describedby');

      fireEvent.blur(button);
      expect(button).not.toHaveAttribute('aria-describedby');
    });

    it('gives the popup role="tooltip"', () => {
      renderTooltip();
      fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('assigns a unique id to each Tooltip instance', () => {
      render(
        <>
          <Tooltip content="first">
            <button type="button">First</button>
          </Tooltip>
          <Tooltip content="second">
            <button type="button">Second</button>
          </Tooltip>
        </>
      );
      const [first, second] = screen.getAllByRole('button');

      fireEvent.focus(first);
      advanceDelay();
      const firstId = screen.getByRole('tooltip').getAttribute('id');

      // We need to blur first, focus the second.
      // The first tooltip should still be in DOM, so get the second tooltip too
      fireEvent.blur(first);
      act(() => { jest.advanceTimersByTime(0); }); // let state settle

      fireEvent.focus(second);
      // Wait for delay
      act(() => { jest.advanceTimersByTime(500); });
      const secondId = screen.getByRole('tooltip').getAttribute('id');

      expect(firstId).not.toBe(secondId);
    });
  });

  describe('styling', () => {
    it('applies the dark background and light text for the tooltip popup', () => {
      renderTooltip();
      fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
      advanceDelay();
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toMatch(/bg-neutral-900/);
      expect(tooltip.className).toMatch(/text-white/);
    });

    it('applies transition-opacity for reduced-motion compatibility', () => {
      renderTooltip();
      fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
      advanceDelay();
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toMatch(/transition-opacity/);
      expect(tooltip.className).toMatch(/duration-150/);
    });

    it('is pointer-events-none so it never blocks clicks on the trigger', () => {
      renderTooltip();
      fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
      advanceDelay();
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toMatch(/pointer-events-none/);
    });
  });

  describe('integration with IconButton', () => {
    it('shows a tooltip when hovering an IconButton with a tooltip prop', () => {
      render(
        <Tooltip content="Copy secret">
          <IconButton label="Copy">⧉</IconButton>
        </Tooltip>
      );
      const button = screen.getByRole('button', { name: 'Copy' });
      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toHaveTextContent('Copy secret');
    });

    it('hides the tooltip on Escape from the IconButton', () => {
      render(
        <Tooltip content="Copy secret">
          <IconButton label="Copy">⧉</IconButton>
        </Tooltip>
      );
      const button = screen.getByRole('button', { name: 'Copy' });
      fireEvent.focus(button);
      advanceDelay();
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.keyDown(button, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });
});
