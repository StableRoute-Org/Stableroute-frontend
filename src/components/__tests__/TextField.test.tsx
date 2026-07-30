import { render, screen, fireEvent } from '@testing-library/react';
import { TextField } from '../TextField';

describe('TextField', () => {
  // ── Basic rendering & accessibility ────────────────────────────────────────

  it('associates label, description, and error regions', () => {
    render(
      <TextField
        label="Source"
        description="Asset code"
        error="Invalid"
        defaultValue=""
      />
    );
    const input = screen.getByLabelText('Source');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toMatch(/desc/);
    expect(input.getAttribute('aria-describedby')).toMatch(/err/);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid');
  });

  it('renders the label and exposes an accessible name', () => {
    render(<TextField label="Email address" defaultValue="" />);
    const input = screen.getByRole('textbox', { name: 'Email address' });
    expect(input).toBeInTheDocument();
  });

  it('renders as an input element', () => {
    render(<TextField label="Name" defaultValue="" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input.tagName).toBe('INPUT');
  });

  it('renders the description when provided', () => {
    render(
      <TextField
        label="Source"
        description="Use 1-12 letters or numbers."
        defaultValue=""
      />
    );
    expect(
      screen.getByText('Use 1-12 letters or numbers.')
    ).toBeInTheDocument();
  });

  it('does not render a description element when omitted', () => {
    render(<TextField label="Source" defaultValue="" />);
    expect(
      screen.queryByText(/letters or numbers/i)
    ).not.toBeInTheDocument();
  });

  it('renders a placeholder when provided', () => {
    render(
      <TextField label="Source" placeholder="USDC" defaultValue="" />
    );
    expect(screen.getByPlaceholderText('USDC')).toBeInTheDocument();
  });

  it('does not set aria-invalid when there is no error', () => {
    render(<TextField label="Source" defaultValue="" />);
    const input = screen.getByLabelText('Source');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('removes aria-invalid when the error prop is cleared', () => {
    const { rerender } = render(
      <TextField label="Source" error="Bad value" defaultValue="" />
    );
    expect(screen.getByLabelText('Source')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    rerender(<TextField label="Source" error={undefined} defaultValue="" />);
    expect(screen.getByLabelText('Source')).not.toHaveAttribute('aria-invalid');
  });

  it('preserves a user-supplied id', () => {
    render(<TextField id="custom-id" label="Source" defaultValue="" />);
    expect(screen.getByLabelText('Source')).toHaveAttribute('id', 'custom-id');
  });

  it('generates a stable auto id when no id prop is given', () => {
    const { container } = render(<TextField label="Source" defaultValue="" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('id');
    expect(input!.id).toBeTruthy();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it('renders the error message with role="alert" for screen readers', () => {
    render(
      <TextField label="Source" error="Must be alphanumeric" defaultValue="" />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Must be alphanumeric');
  });

  it('associates the error element with the input via aria-describedby', () => {
    render(
      <TextField label="Source" error="Invalid code" defaultValue="" />
    );
    const input = screen.getByLabelText('Source');
    expect(input.getAttribute('aria-describedby')).toMatch(/err/);
  });

  it('clears the error message when the error prop is removed', () => {
    const { rerender } = render(
      <TextField label="Source" error="Invalid code" defaultValue="" />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<TextField label="Source" error={undefined} defaultValue="" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the error visible when the error prop changes to a new message', () => {
    const { rerender } = render(
      <TextField label="Source" error="Invalid code" defaultValue="" />
    );
    rerender(
      <TextField
        label="Source"
        error="Must differ"
        defaultValue=""
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Must differ');
  });

  // ── Disabled state ─────────────────────────────────────────────────────────

  it('renders as disabled when the disabled prop is true', () => {
    render(<TextField label="Source" disabled defaultValue="" />);
    expect(screen.getByLabelText('Source')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<TextField label="Source" defaultValue="" />);
    expect(screen.getByLabelText('Source')).not.toBeDisabled();
  });

  it('does not accept input when disabled', () => {
    render(
      <TextField
        label="Source"
        disabled
        defaultValue="existing"
      />
    );
    const input = screen.getByLabelText('Source');
    expect(input).toBeDisabled();
    expect(input).toHaveValue('existing');
  });

  // ── Busy / loading state (via aria-busy) ───────────────────────────────────

  it('forwards aria-busy to the underlying input', () => {
    render(
      <TextField label="Source" aria-busy="true" defaultValue="" />
    );
    expect(screen.getByLabelText('Source')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('does not set aria-busy when not provided', () => {
    render(<TextField label="Source" defaultValue="" />);
    expect(screen.getByLabelText('Source')).not.toHaveAttribute('aria-busy');
  });

  it('accepts both disabled and aria-busy together for submission states', () => {
    render(
      <TextField
        label="Source"
        disabled
        aria-busy="true"
        defaultValue=""
      />
    );
    const input = screen.getByLabelText('Source');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('aria-busy', 'true');
  });

  // ── Value & keyboard interaction ───────────────────────────────────────────

  it('accepts text input via keyboard', () => {
    const handleChange = jest.fn();
    render(
      <TextField label="Source" defaultValue="" onChange={handleChange} />
    );
    const input = screen.getByLabelText('Source');
    fireEvent.change(input, { target: { value: 'USDC' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays the controlled value', () => {
    render(<TextField label="Source" value="USDC" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Source')).toHaveValue('USDC');
  });

  it('accepts a defaultValue for uncontrolled usage', () => {
    render(<TextField label="Source" defaultValue="EURC" />);
    expect(screen.getByLabelText('Source')).toHaveValue('EURC');
  });

  it('shows empty state when no value is provided', () => {
    render(<TextField label="Source" defaultValue="" />);
    expect(screen.getByLabelText('Source')).toHaveValue('');
  });

  it('updates the displayed value as the user types', () => {
    render(<TextField label="Source" defaultValue="" />);
    const input = screen.getByLabelText('Source');
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.change(input, { target: { value: 'XL' } });
    fireEvent.change(input, { target: { value: 'XLM' } });
    expect(input).toHaveValue('XLM');
  });

  // ── Forwarded HTML attributes ──────────────────────────────────────────────

  it('forwards the name attribute', () => {
    render(
      <TextField label="Source" name="source_asset" defaultValue="" />
    );
    expect(screen.getByLabelText('Source')).toHaveAttribute(
      'name',
      'source_asset'
    );
  });

  it('forwards the type attribute', () => {
    render(<TextField label="URL" type="url" defaultValue="" />);
    const input = screen.getByLabelText('URL');
    expect(input).toHaveAttribute('type', 'url');
  });

  it('forwards the required attribute', () => {
    render(<TextField label="Source" required defaultValue="" />);
    expect(screen.getByLabelText('Source')).toBeRequired();
  });

  it('forwards maxLength', () => {
    render(<TextField label="Source" maxLength={12} defaultValue="" />);
    expect(screen.getByLabelText('Source')).toHaveAttribute('maxLength', '12');
  });

  it('forwards inputMode', () => {
    render(<TextField label="Amount" inputMode="numeric" defaultValue="" />);
    expect(screen.getByLabelText('Amount')).toHaveAttribute(
      'inputMode',
      'numeric'
    );
  });

  it('forwards aria-invalid explicitly', () => {
    render(
      <TextField
        label="Source"
        error="Bad"
        aria-invalid="true"
        defaultValue=""
      />
    );
    expect(screen.getByLabelText('Source')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('merges a custom className with base styles', () => {
    const { container } = render(
      <TextField label="Source" className="extra-class" defaultValue="" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('extra-class');
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
  });

  // ── Focus & keyboard accessibility ─────────────────────────────────────────

  it('associates the label with the input via htmlFor', () => {
    render(<TextField label="Source" defaultValue="" />);
    const input = screen.getByLabelText('Source');
    const label = input.closest('div')!.querySelector('label')!;
    expect(label).toHaveAttribute('for', input.id);
  });

  it('applies focus-visible outline classes', () => {
    render(<TextField label="Source" defaultValue="" />);
    const input = screen.getByLabelText('Source');
    expect(input.className).toMatch(/focus-visible:outline\b/);
    expect(input.className).toMatch(/focus-visible:outline-2\b/);
  });

  it('does not hardcode a Tailwind color utility for the outline', () => {
    render(<TextField label="Source" defaultValue="" />);
    const input = screen.getByLabelText('Source');
    expect(input.className).not.toMatch(/focus-visible:outline-blue-\d+/);
  });
});
