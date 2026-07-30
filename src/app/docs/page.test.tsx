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
    const copyButtons = screen.getAllByRole('button', {
      name: /Copy .* code for/,
    });
    expect(copyButtons.length).toBe(5);
  });

  describe('Search component docs', () => {
    it('renders search component section heading', () => {
      render(<DocsPage />);
      expect(
        screen.getByRole('heading', { name: 'Search component' })
      ).toBeInTheDocument();
    });

    it('documents that CommandPalette accepts zero props', () => {
      render(<DocsPage />);
      expect(
        screen.getByText(/The component accepts no props/)
      ).toBeInTheDocument();
    });

    it('references the ROUTES data source', () => {
      render(<DocsPage />);
      expect(screen.getByText(/ROUTES/)).toBeInTheDocument();
      expect(screen.getByText(/@\/lib\/routes/)).toBeInTheDocument();
    });

    it('lists keyboard shortcuts for Ctrl+K and Cmd+K', () => {
      render(<DocsPage />);
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('lists keyboard shortcuts for Escape, arrows, and Enter', () => {
      render(<DocsPage />);
      expect(screen.getByText('Esc')).toBeInTheDocument();
      expect(screen.getByText('↓ ↑')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
    });

    it('documents case-insensitive filtering behavior', () => {
      render(<DocsPage />);
      expect(
        screen.getByText(/filters routes case-insensitively/)
      ).toBeInTheDocument();
      expect(screen.getByText(/No routes found/)).toBeInTheDocument();
    });

    it('documents ARIA roles for dialog, combobox, listbox, and option', () => {
      render(<DocsPage />);
      const table = screen.getByRole('table');
      expect(within(table).getByText('dialog')).toBeInTheDocument();
      expect(within(table).getByText('combobox')).toBeInTheDocument();
      expect(within(table).getByText('listbox')).toBeInTheDocument();
      expect(within(table).getByText('option')).toBeInTheDocument();
    });

    it('documents ARIA attributes in the table', () => {
      render(<DocsPage />);
      const table = screen.getByRole('table');
      expect(
        within(table).getByText(/aria-modal="true"/)
      ).toBeInTheDocument();
      expect(
        within(table).getByText(/aria-label="Command palette"/)
      ).toBeInTheDocument();
      expect(
        within(table).getByText(/aria-expanded/)
      ).toBeInTheDocument();
      expect(
        within(table).getByText(/aria-controls/)
      ).toBeInTheDocument();
      expect(
        within(table).getByText(/aria-activedescendant/)
      ).toBeInTheDocument();
      expect(
        within(table).getByText(/aria-selected/)
      ).toBeInTheDocument();
    });

    it('renders a usage example with import statement', () => {
      render(<DocsPage />);
      expect(
        screen.getByText(/import { CommandPalette } from/)
      ).toBeInTheDocument();
    });

    it('shows the zero-props rendering pattern in the usage example', () => {
      render(<DocsPage />);
      expect(
        screen.getByText(/takes zero props/)
      ).toBeInTheDocument();
    });
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
