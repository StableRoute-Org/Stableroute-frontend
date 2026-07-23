import { render, screen, within } from '@testing-library/react';
import DocsPage, { dynamic } from './page';
import { OpenApiLink } from './OpenApiLink';

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ push: jest.fn() }),
}));

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

  it('renders code samples for each endpoint', () => {
    render(<DocsPage />);
    // Default language is cURL — check samples are rendered
    expect(
      screen.getByText(/curl -X POST http:\/\/localhost:3001\/api\/v1\/pairs/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/curl http:\/\/localhost:3001\/api\/v1\/pairs/)
    ).toBeInTheDocument();
  });

  it('renders language selector radio groups for each endpoint', () => {
    render(<DocsPage />);
    const radioGroups = screen.getAllByRole('radiogroup', { name: 'Language' });
    expect(radioGroups.length).toBe(5);
  });

  it('renders copy buttons for each endpoint', () => {
    render(<DocsPage />);
    const copyButtons = screen.getAllByRole('button', { name: /Copy .* code for/ });
    expect(copyButtons.length).toBe(5);
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
