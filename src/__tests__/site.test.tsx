import { render, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/ToastProvider';
import Home from '@/app/page';
import DocsPage from '@/app/docs/page';
import { CONTRACT_ID } from '@/lib/site';

describe('marketing site', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response)) as jest.Mock;
  });

  it('renders the landing hero and contract id', async () => {
    render(<Home />);
    await screen.findByText(/Online/);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Route stablecoins/);
    expect(screen.getAllByText(CONTRACT_ID).length).toBeGreaterThan(0);
  });

  it('renders the docs page sections', () => {
    render(
      <ToastProvider>
        <DocsPage />
      </ToastProvider>
    );
    expect(screen.getByRole('heading', { name: 'Architecture' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Smart contract' })).toBeInTheDocument();
    expect(screen.getByText(CONTRACT_ID)).toBeInTheDocument();
  });
});
