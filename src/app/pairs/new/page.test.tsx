import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewPairPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('NewPairPage', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockPush.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function submitPair(source: string, destination: string) {
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: source },
    });
    fireEvent.change(screen.getByLabelText('Destination'), {
      target: { value: destination },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /Register pair/i }).closest('form')!
    );
  }

  it('normalizes lowercase and surrounding whitespace before submit', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => '{}',
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair(' usdc ', ' eurc ');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pairs');
    });
    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(JSON.parse(requestInit.body as string)).toEqual({
      source: 'USDC',
      destination: 'EURC',
    });
  });

  it.each(['USD-C', 'USD C', 'ABCDEFGHIJKLM'])(
    'rejects invalid source asset code %s with accessible field errors',
    async (code) => {
      const mockFetch = jest.fn();
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      render(<NewPairPage />);
      submitPair(code, 'EURC');

      const sourceInput = document.getElementById('source');
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          /ASCII letters or numbers/i
        );
      });
      expect(sourceInput).toHaveAttribute('aria-invalid', 'true');
      expect(sourceInput).toHaveAttribute('aria-describedby', 'source-err');
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it('rejects pairs that are identical after trimming and uppercasing', async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair(' usdc ', 'USDC');

    const destinationInput = document.getElementById('destination');
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/must differ/i);
    });
    expect(destinationInput).toHaveAttribute('aria-invalid', 'true');
    expect(destinationInput).toHaveAttribute(
      'aria-describedby',
      'destination-err'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('validates empty fields with inline errors instead of native browser validation', async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    fireEvent.submit(
      screen.getByRole('button', { name: /Register pair/i }).closest('form')!
    );

    await waitFor(() => {
      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });
    expect(document.getElementById('source')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(document.getElementById('destination')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('clears an identical-pair error when source changes', async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair('USDC', 'USDC');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/must differ/i);
    });
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'XLM' },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the in-flight submit label while the pair is saving', async () => {
    let resolvePost: (() => void) | undefined;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = () =>
            resolve({
              ok: true,
              text: async () => '{}',
            } as unknown as Response);
        })
    ) as unknown as typeof global.fetch;

    render(<NewPairPage />);
    submitPair('XLM', 'USDC');

    expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
    resolvePost?.();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pairs');
    });
  });

  it('surfaces backend errors without losing the normalized request body', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: 'invalid_request',
          message: 'Pair already exists',
        }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<NewPairPage />);
    submitPair('xlm', 'usdc');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Pair already exists/i
      );
    });
    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(requestInit.body as string)).toEqual({
      source: 'XLM',
      destination: 'USDC',
    });
  });
});
