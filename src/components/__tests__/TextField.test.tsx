import { render, screen } from '@testing-library/react';
import { TextField } from '../TextField';

describe('TextField', () => {
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
});
