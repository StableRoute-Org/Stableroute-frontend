import { render, screen } from '@testing-library/react';
import DocsPage, { dynamic } from './page';
import { OpenApiLink } from './OpenApiLink';

describe('DocsPage', () => {
  const originalEnv = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;

  afterEach(() => {
    if (originalEnv === undefined)
      delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    else process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = originalEnv;
  });

  it('exports force-static dynamic route directive', () => {
    expect(dynamic).toBe('force-static');
  });

  it('lists endpoint sections', () => {
    render(<DocsPage />);
    expect(screen.getByText(/POST \/api\/v1\/pairs/i)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/quote/i)).toBeInTheDocument();
  });

  it('forms a valid heading outline without skipping levels', () => {
    const { container } = render(<DocsPage />);
    const headings = Array.from(
      container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );
    const levels = headings.map((h) => parseInt(h.tagName[1], 10));

    expect(levels.length).toBeGreaterThan(0);
    expect(levels[0]).toBe(1); // Page starts with h1
    
    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1];
      const curr = levels[i];
      // A heading can be any level up to prev + 1
      expect(curr).toBeLessThanOrEqual(prev + 1);
    }
  });

  it('marks openapi.json as an external link', () => {
    render(<DocsPage />);
    const link = screen.getByRole('link', { name: /openapi\.json/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('resolves openapi.json href from the env-driven API base', () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = 'https://api.example.test';
    render(<DocsPage />);
    const link = screen.getByRole('link', { name: /openapi\.json/i });
    expect(link).toHaveAttribute(
      'href',
      'https://api.example.test/api/v1/openapi.json'
    );
  });

  it('falls back to localhost API base when env is not set', () => {
    delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    render(<DocsPage />);
    const link = screen.getByRole('link', { name: /openapi\.json/i });
    expect(link).toHaveAttribute(
      'href',
      'http://localhost:3001/api/v1/openapi.json'
    );
  });
});

describe('OpenApiLink', () => {
  const originalEnv = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;

  afterEach(() => {
    if (originalEnv === undefined)
      delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    else process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = originalEnv;
  });

  it('renders external OpenAPI link component with target and rel attributes', () => {
    render(<OpenApiLink />);
    const link = screen.getByRole('link', { name: /openapi\.json/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('resolves custom API base URL correctly in OpenApiLink', () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = 'https://custom.api.test';
    render(<OpenApiLink />);
    const link = screen.getByRole('link', { name: /openapi\.json/i });
    expect(link).toHaveAttribute(
      'href',
      'https://custom.api.test/api/v1/openapi.json'
    );
  });
});
