import { render, screen, fireEvent } from '@testing-library/react';
import Link from 'next/link';
import { Button } from '../Button';

describe('Button', () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it('renders a native button by default', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('renders children as the accessible name', () => {
    render(<Button>Create API key</Button>);
    expect(
      screen.getByRole('button', { name: 'Create API key' })
    ).toBeInTheDocument();
  });

  it('defaults to the primary variant', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toMatch(/bg-black/);
    expect(button.className).toMatch(/text-white/);
  });

  it('renders the secondary variant', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).toMatch(/border/);
    expect(button.className).toMatch(/border-neutral-300/);
  });

  it('renders the danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.className).toMatch(/bg-rose-600/);
    expect(button.className).toMatch(/text-white/);
  });

  it('applies variant-specific styles', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).toMatch(/border/);
  });

  // ── Disabled state ─────────────────────────────────────────────────────────

  it('renders as disabled when the disabled prop is true', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('applies disabled styling classes when disabled', () => {
    render(<Button disabled>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toMatch(/disabled:opacity-50/);
    expect(button.className).toMatch(/disabled:cursor-not-allowed/);
  });

  it('is not disabled by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Save
      </Button>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled styling to all variants', () => {
    (['primary', 'secondary', 'danger'] as const).forEach((variant) => {
      render(
        <Button variant={variant} disabled>
          {variant}
        </Button>
      );
      const button = screen.getByRole('button', { name: variant });
      expect(button.className).toMatch(/disabled:opacity-50/);
      expect(button.className).toMatch(/disabled:cursor-not-allowed/);
    });
  });

  // ── Busy / loading state ───────────────────────────────────────────────────

  it('forwards aria-busy to the native button', () => {
    render(<Button aria-busy="true">Saving…</Button>);
    expect(screen.getByRole('button', { name: 'Saving…' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('does not set aria-busy when not provided', () => {
    render(<Button>Save</Button>);
    expect(
      screen.getByRole('button', { name: 'Save' })
    ).not.toHaveAttribute('aria-busy');
  });

  it('accepts both disabled and aria-busy for submission states', () => {
    render(
      <Button disabled aria-busy="true">
        Saving…
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('still exposes the accessible name while busy', () => {
    render(
      <Button disabled aria-busy="true">
        Submitting…
      </Button>
    );
    expect(
      screen.getByRole('button', { name: 'Submitting…' })
    ).toBeInTheDocument();
  });

  // ── Click handling ─────────────────────────────────────────────────────────

  it('calls the onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick exactly once per click', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  // ── Type attribute ─────────────────────────────────────────────────────────

  it('renders as a button that can submit forms (button role is interactive)', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('forwards type="button" to prevent form submission', () => {
    render(<Button type="button">Cancel</Button>);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute(
      'type',
      'button'
    );
  });

  it('forwards type="reset"', () => {
    render(<Button type="reset">Reset</Button>);
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveAttribute(
      'type',
      'reset'
    );
  });

  // ── Additional HTML attributes ──────────────────────────────────────────────

  it('forwards the name attribute', () => {
    render(<Button name="action">Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute(
      'name',
      'action'
    );
  });

  it('forwards the value attribute', () => {
    render(<Button value="delete">Remove</Button>);
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveAttribute(
      'value',
      'delete'
    );
  });

  it('merges a custom className with the variant classes', () => {
    render(<Button className="extra-class">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toMatch(/extra-class/);
    expect(button.className).toMatch(/rounded-full/);
  });
});

describe('Button asChild', () => {
  it('merges styles onto a child link', () => {
    render(
      <Button asChild variant="secondary">
        <Link href="/pairs">Pairs</Link>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Pairs' });
    expect(link.className).toMatch(/border/);
    expect(link).toHaveAttribute('href', '/pairs');
  });

  it('renders a native button when asChild is false', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' }).tagName).toBe('BUTTON');
  });
});

describe('Button focus ring', () => {
  it('applies the token-driven focus-visible outline classes', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toMatch(/focus-visible:outline\b/);
    expect(button.className).toMatch(/focus-visible:outline-2\b/);
    expect(button.className).toContain(
      'focus-visible:outline-offset-[var(--focus-ring-offset)]'
    );
    expect(button.className).toContain(
      'focus-visible:outline-[color:var(--focus-ring-color)]'
    );
  });

  it('does not hardcode a Tailwind color utility for the outline', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).not.toMatch(/focus-visible:outline-blue-\d+/);
  });

  it('carries the focus ring onto every variant', () => {
    (['primary', 'secondary', 'danger'] as const).forEach((variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole('button', { name: variant });
      expect(button.className).toContain(
        'focus-visible:outline-[color:var(--focus-ring-color)]'
      );
    });
  });

  it('keeps the focus ring on the merged child when asChild is used', () => {
    render(
      <Button asChild>
        <Link href="/pairs">Pairs</Link>
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Pairs' });
    expect(link.className).toContain(
      'focus-visible:outline-[color:var(--focus-ring-color)]'
    );
  });
});
