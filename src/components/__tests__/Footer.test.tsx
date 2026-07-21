import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders the tagline with the current copyright year', () => {
    render(<Footer />);

    expect(
      screen.getByText('StableRoute — liquidity routing on Stellar.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} StableRoute`))
    ).toBeInTheDocument();
  });

  it('links to docs, about, and the external Discord community', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      '/docs'
    );
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );

    const discordLink = screen.getByRole('link', {
      name: 'StableRoute Discord (opens externally)',
    });
    expect(discordLink).toHaveAttribute('href', 'https://discord.gg/37aCpusvx');
    expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
