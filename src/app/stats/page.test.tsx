import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ToastProvider } from '@/components/ToastProvider';
import StatsPage from './page';
import {
  buildStatsSnapshot,
  downloadStatsSnapshot,
  formatStatsAge,
  statsSnapshotToCsv,
  statsSnapshotToJson,
  statsSnapshotToText,
} from './Client';

const mockFetch = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response);
};

const renderStatsPage = () =>
  render(
    <ToastProvider>
      <StatsPage />
    </ToastProvider>
  );

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('StatsPage', () => {
  it('renders the heading', async () => {
    mockFetch({ totalPairs: 0, paused: false });
    renderStatsPage();
    expect(screen.getByRole('heading', { name: /stats/i })).toBeInTheDocument();
    await screen.findByText('Live');
  });

  it('renders one canonical stats page region and heading', async () => {
    mockFetch({ totalPairs: 0, paused: false });
    renderStatsPage();

    expect(screen.getAllByRole('heading', { name: /stats/i })).toHaveLength(1);
    expect(document.querySelectorAll('#main-content')).toHaveLength(1);
    await screen.findByText('Live');
  });

  it('names the metrics panel with an accessible region', async () => {
    mockFetch({ totalPairs: 12, paused: false });
    renderStatsPage();

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /router metrics/i })
      ).toBeInTheDocument();
    });
  });

  it('formats totalPairs with thousands separators via formatNumber', async () => {
    mockFetch({ totalPairs: 1234567, paused: false });
    renderStatsPage();
    const pairs = await screen.findByText('1,234,567');
    expect(pairs).toBeInTheDocument();
  });

  it('renders Live when paused is false', async () => {
    mockFetch({ totalPairs: 0, paused: false });
    renderStatsPage();
    const status = await screen.findByText('Live');
    expect(status).toBeInTheDocument();
  });

  it('renders Paused when paused is true', async () => {
    mockFetch({ totalPairs: 0, paused: true });
    renderStatsPage();
    const status = await screen.findByText('Paused');
    expect(status).toBeInTheDocument();
  });

  it('renders error message on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    renderStatsPage();
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/network request failed/i);
    });
  });

  it('keeps the existing 5 second polling update behavior', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ totalPairs: 1, paused: false })),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ totalPairs: 2000, paused: true })),
      } as unknown as Response);

    renderStatsPage();

    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(await screen.findByText('Live')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(await screen.findByText('2,000')).toBeInTheDocument();
    expect(await screen.findByText('Paused')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('clears the polling interval on unmount', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({ totalPairs: 42, paused: false })),
    } as unknown as Response);

    const { unmount } = renderStatsPage();
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('shows when the latest successful response was received and updates the age', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-22T12:00:00.000Z'));
    mockFetch({ totalPairs: 42, paused: false });

    renderStatsPage();

    const timestamp = await screen.findByText('just now');
    expect(timestamp.tagName).toBe('TIME');
    expect(timestamp.getAttribute('datetime')).toMatch(
      /^2026-07-22T12:00:00\.\d{3}Z$/
    );
    expect(timestamp).toHaveAttribute('title');

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.getByText('1s ago')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('resets the age after the next successful polling response', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-22T12:00:00.000Z'));
    mockFetch({ totalPairs: 42, paused: false });

    renderStatsPage();
    expect(await screen.findByText('just now')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(await screen.findByText('just now')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('clears both polling and freshness intervals on unmount', async () => {
    jest.useFakeTimers();
    mockFetch({ totalPairs: 42, paused: false });

    const { unmount } = renderStatsPage();
    expect(await screen.findByText('just now')).toBeInTheDocument();
    expect(jest.getTimerCount()).toBe(2);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('formatStatsAge', () => {
  it.each([
    [-1_000, 'just now'],
    [0, 'just now'],
    [59_999, '59s ago'],
    [60_000, '1m ago'],
    [3_599_999, '59m ago'],
    [3_600_000, '1h ago'],
    [86_400_000, '1d ago'],
  ])('formats %i milliseconds as %s', (deltaMs, expected) => {
    expect(formatStatsAge(deltaMs)).toBe(expected);
  });
});

describe('buildStatsSnapshot', () => {
  it('captures the raw numeric value and formatted display per metric', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 1234567, paused: false },
      '2026-07-21T00:00:00.000Z'
    );

    expect(snapshot.capturedAt).toBe('2026-07-21T00:00:00.000Z');
    expect(snapshot.metrics).toEqual([
      { label: 'Pairs', value: 1234567, display: '1,234,567' },
      { label: 'Status', value: 0, display: 'Live' },
    ]);
  });

  it('encodes paused as a numeric 1 with a Paused display', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 0, paused: true },
      '2026-07-21T00:00:00.000Z'
    );

    expect(snapshot.metrics).toContainEqual({
      label: 'Status',
      value: 1,
      display: 'Paused',
    });
  });

  it('defaults capturedAt to the current time when omitted', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
    const snapshot = buildStatsSnapshot({ totalPairs: 5, paused: false });
    expect(snapshot.capturedAt).toBe('2026-01-01T12:00:00.000Z');
  });
});

describe('statsSnapshotToJson', () => {
  it('serialises the snapshot as pretty-printed JSON round-trippable back to the same shape', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 42, paused: false },
      '2026-07-21T00:00:00.000Z'
    );
    const json = statsSnapshotToJson(snapshot);

    expect(JSON.parse(json)).toEqual(snapshot);
    expect(json).toContain('\n');
  });
});

describe('statsSnapshotToText', () => {
  it('serialises the displayed metric values into a concise snapshot', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 1234567, paused: true },
      '2026-07-23T05:30:00.000Z'
    );

    expect(statsSnapshotToText(snapshot)).toBe(
      [
        'StableRoute stats snapshot',
        'Pairs: 1,234,567',
        'Status: Paused',
        'Captured: 2026-07-23T05:30:00.000Z',
      ].join('\n')
    );
  });
});

describe('statsSnapshotToCsv', () => {
  it('emits a header row followed by one row per metric', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 42, paused: false },
      '2026-07-21T00:00:00.000Z'
    );
    const csv = statsSnapshotToCsv(snapshot);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('label,value,display,capturedAt');
    expect(lines[1]).toBe('Pairs,42,42,2026-07-21T00:00:00.000Z');
    expect(lines[2]).toBe('Status,0,Live,2026-07-21T00:00:00.000Z');
  });

  it('quotes display values that contain commas from thousands separators', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 1234567, paused: false },
      '2026-07-21T00:00:00.000Z'
    );
    const csv = statsSnapshotToCsv(snapshot);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('Pairs,1234567,"1,234,567",2026-07-21T00:00:00.000Z');
  });

  it('escapes embedded quote characters by doubling them', () => {
    const snapshot = buildStatsSnapshot(
      { totalPairs: 0, paused: false },
      '2026-07-21T00:00:00.000Z'
    );
    snapshot.metrics[0].display = 'weird "quoted" value';
    const csv = statsSnapshotToCsv(snapshot);

    expect(csv.split('\n')[1]).toContain('"weird ""quoted"" value"');
  });
});

describe('downloadStatsSnapshot', () => {
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let clickSpy: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T00:00:00.000Z'));
    createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    revokeObjectURL = jest.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clickSpy = jest.fn();
    jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(clickSpy);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('builds a Blob, clicks a download link, and revokes the object URL afterwards', () => {
    downloadStatsSnapshot({ totalPairs: 3, paused: false }, 'json');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('names the JSON download with a sanitised timestamp and .json extension', () => {
    downloadStatsSnapshot({ totalPairs: 3, paused: false }, 'json');
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe(
      'stats-snapshot-2026-07-21T00-00-00-000Z.json'
    );
  });

  it('names the CSV download with a .csv extension and text/csv mime type', () => {
    downloadStatsSnapshot({ totalPairs: 3, paused: false }, 'csv');
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;

    expect(blob.type).toBe('text/csv');
    expect(anchor.download).toBe('stats-snapshot-2026-07-21T00-00-00-000Z.csv');
  });

  it('revokes the object URL even though the anchor is removed synchronously', () => {
    downloadStatsSnapshot({ totalPairs: 3, paused: false }, 'csv');
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});

describe('StatsPage download controls', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = jest.fn();
    jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Download JSON and Download CSV controls once stats load', async () => {
    mockFetch({ totalPairs: 7, paused: false });
    renderStatsPage();

    expect(
      await screen.findByRole('button', { name: /download json/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download csv/i })
    ).toBeInTheDocument();
  });

  it('does not render download controls while loading or on error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    renderStatsPage();

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(
      screen.queryByRole('button', { name: /download json/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copy stats snapshot' })
    ).not.toBeInTheDocument();
  });

  it('triggers a JSON blob download when Download JSON is clicked', async () => {
    mockFetch({ totalPairs: 7, paused: true });
    renderStatsPage();

    const button = await screen.findByRole('button', {
      name: /download json/i,
    });
    fireEvent.click(button);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
  });

  it('triggers a CSV blob download when Download CSV is clicked', async () => {
    mockFetch({ totalPairs: 7, paused: false });
    renderStatsPage();

    const button = await screen.findByRole('button', { name: /download csv/i });
    fireEvent.click(button);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv');
  });
});

describe('StatsPage copy control', () => {
  const originalSecureContext = window.isSecureContext;
  const originalClipboard = navigator.clipboard;

  function setClipboard(value: unknown) {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value,
    });
  }

  function setSecureContext(value: boolean) {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value,
    });
  }

  afterEach(() => {
    setSecureContext(originalSecureContext);
    setClipboard(originalClipboard);
  });

  it('copies a snapshot using the current displayed values and confirms it', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setSecureContext(true);
    setClipboard({ writeText });
    mockFetch({ totalPairs: 1234567, paused: true });

    renderStatsPage();

    expect(await screen.findByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Copy stats snapshot' })
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copiedText = writeText.mock.calls[0][0] as string;
    expect(copiedText).toContain('Pairs: 1,234,567');
    expect(copiedText).toContain('Status: Paused');
    expect(copiedText).toMatch(
      /Captured: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Stats snapshot copied.'
    );
  });

  it('shows a selectable fallback with empty stats when clipboard writing fails', async () => {
    setSecureContext(true);
    setClipboard({
      writeText: jest.fn().mockRejectedValue(new Error('denied')),
    });
    mockFetch({ totalPairs: 0, paused: false });

    renderStatsPage();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy stats snapshot' })
    );

    const fallback = await screen.findByRole('textbox', {
      name: 'Stats snapshot text',
    });
    expect((fallback as HTMLTextAreaElement).value).toContain('Pairs: 0');
    expect((fallback as HTMLTextAreaElement).value).toContain('Status: Live');
    expect(fallback).toHaveAttribute('readonly');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't copy automatically. Select the snapshot below to copy it."
    );

    const select = jest.spyOn(fallback, 'select');
    fireEvent.focus(fallback);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('blocks repeated clicks while a clipboard write is pending', async () => {
    let resolveWrite!: () => void;
    const writeText = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        })
    );
    setSecureContext(true);
    setClipboard({ writeText });
    mockFetch({ totalPairs: 7, paused: false });

    renderStatsPage();

    const button = await screen.findByRole('button', {
      name: 'Copy stats snapshot',
    });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();

    resolveWrite();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('uses the fallback when the Clipboard API is unavailable', async () => {
    setSecureContext(true);
    setClipboard(undefined);
    mockFetch({ totalPairs: 42, paused: false });

    renderStatsPage();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy stats snapshot' })
    );

    const fallback = await screen.findByRole('textbox', {
      name: 'Stats snapshot text',
    });
    expect((fallback as HTMLTextAreaElement).value).toContain('Pairs: 42');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
