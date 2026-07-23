import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import StatusPage from './page';

let mockFetch: jest.Mock;

function mockFetchOnce(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response);
}

function mockFetchErrorOnce() {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
}

function mockFetchPending() {
  mockFetch.mockImplementationOnce(
    () => new Promise(() => { /* never settles */ })
  );
}

beforeEach(() => {
  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('StatusPage', () => {
  it('renders the heading', () => {
    mockFetchOnce({});
    render(<StatusPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /status/i })
    ).toBeInTheDocument();
  });

  it('shows the resolved API base URL', async () => {
    mockFetchOnce({});
    render(<StatusPage />);
    await waitFor(() => {
      expect(screen.getByText('http://localhost:3001')).toBeInTheDocument();
    });
  });

  it('ensures one canonical main region and heading', () => {
    mockFetchOnce({});
    render(<StatusPage />);
    expect(document.querySelectorAll('#main-content')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows Reachable and a 200 status on a successful probe', async () => {
    mockFetchOnce({ status: 'ok' });
    render(<StatusPage />);
    expect(await screen.findByText('Reachable')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('reports round-trip latency in milliseconds', async () => {
    mockFetchOnce({});
    render(<StatusPage />);
    const latency = await screen.findByText((content) =>
      /^\d+ ms$/.test(content.trim())
    );
    expect(latency).toBeInTheDocument();
  });

  it('shows Unreachable and no HTTP status on a network error', async () => {
    mockFetchErrorOnce();
    render(<StatusPage />);
    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows Unreachable with the HTTP status on an error response', async () => {
    mockFetchOnce({ error: 'Service Unavailable' }, false, 503);
    render(<StatusPage />);
    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
    expect(screen.getByText('503')).toBeInTheDocument();
  });

  it('reports latency even when the probe fails', async () => {
    mockFetchErrorOnce();
    render(<StatusPage />);
    const latency = await screen.findByText((content) =>
      /^\d+ ms$/.test(content.trim())
    );
    expect(latency).toBeInTheDocument();
  });

  it('renders the last checked time as a <time> element via TimeAgo', async () => {
    mockFetchOnce({});
    const { container } = render(<StatusPage />);
    await screen.findByText('Reachable');
    const timeEl = container.querySelector('time');
    expect(timeEl).toBeInTheDocument();
  });

  it('shows a loading indicator while probing', () => {
    jest.useFakeTimers();
    mockFetchPending();
    render(<StatusPage />);
    expect(screen.getByRole('button', { name: /probing/i })).toBeDisabled();
    expect(screen.getAllByText('Probing\u2026').length).toBeGreaterThanOrEqual(1);
  });

  it('re-probes when the "Probe again" button is clicked', async () => {
    mockFetchOnce({});
    render(<StatusPage />);
    expect(await screen.findByText('Reachable')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetchOnce({});
    fireEvent.click(screen.getByRole('button', { name: /probe again/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('disables the probe button while a probe is running', async () => {
    jest.useFakeTimers();

    mockFetch = jest.fn().mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({})),
              } as unknown as Response),
            1000
          )
        )
    );
    global.fetch = mockFetch;

    render(<StatusPage />);
    const button = screen.getByRole('button', { name: /probing/i });
    expect(button).toBeDisabled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /probe again/i })
      ).not.toBeDisabled();
    });
  });

  it('marks the results region with an accessible aria label', async () => {
    mockFetchOnce({});
    render(<StatusPage />);
    const region = await screen.findByRole('region', {
      name: /probe results/i,
    });
    expect(region).toBeInTheDocument();
  });

  it('cleans up on unmount without errors', async () => {
    mockFetchOnce({});
    const { unmount } = render(<StatusPage />);
    await screen.findByText('Reachable');
    expect(() => unmount()).not.toThrow();
  });
});