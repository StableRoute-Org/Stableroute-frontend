import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound', () => {
  it('renders the 404 heading, copy, and back-to-home link', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByText(/that page does not exist/i)).toBeInTheDocument();
    const home = screen.getByRole('link', { name: /back to home/i });
    expect(home).toHaveAttribute('href', '/');
  });

  it('exposes the main-content focus target with outline-none styling', () => {
    render(<NotFound />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main.className).toContain('focus:outline-none');
  });
});
