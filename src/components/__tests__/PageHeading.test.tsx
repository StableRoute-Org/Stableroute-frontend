import { render, screen } from '@testing-library/react';
import { PageHeading } from '../PageHeading';

describe('PageHeading', () => {
  it('renders title, description, and action', () => {
    render(
      <PageHeading
        title="Pairs"
        description="Manage routing pairs."
        action={<button type="button">New</button>}
      />
    );
    expect(screen.getByRole('heading', { name: 'Pairs' })).toBeInTheDocument();
    expect(screen.getByText('Manage routing pairs.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });
});
