import {
  escapeCsvCell,
  exportToCsv,
  exportToJson,
  CSV_COLUMNS,
  triggerDownload,
} from '../exportData';
import {
  applyViewState,
  DEFAULT_VIEW_STATE,
  type HistoryEntry,
} from '@/app/quote/tableModel';

function makeEntry(
  source: string,
  dest: string,
  amount: string,
  savedAt: number
): HistoryEntry {
  return { source, dest, amount, savedAt };
}

const mockHistory: HistoryEntry[] = [
  makeEntry('USDC', 'EURC', '1000', 1700000000000),
  makeEntry('XLM', 'USDC', '500', 1700000001000),
  makeEntry('USDC', 'NGN', '250', 1700000002000),
  makeEntry('BTC', 'USDC', '0.05', 1700000003000),
];

describe('escapeCsvCell', () => {
  it('neutralizes cells starting with = (formula-injection protection)', () => {
    const raw = '=SUM(A1:A10)';
    const escaped = escapeCsvCell(raw);
    // Must be prefixed with single quote and enclosed in quotes
    expect(escaped).toBe("\"'=SUM(A1:A10)\"");
  });

  it('neutralizes cells starting with +, -, @ triggers', () => {
    expect(escapeCsvCell('+123')).toBe("\"'+123\"");
    expect(escapeCsvCell('-456')).toBe("\"'-456\"");
    expect(escapeCsvCell('@cmd')).toBe("\"'@cmd\"");
  });

  it('escapes cells containing commas, quotes, and newlines', () => {
    expect(escapeCsvCell('USDC, EURC')).toBe('"USDC, EURC"');
    expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvCell("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it('returns plain string without quotes when safe', () => {
    expect(escapeCsvCell('USDC')).toBe('USDC');
    expect(escapeCsvCell(12345)).toBe('12345');
  });

  it('handles null and undefined gracefully', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });
});

describe('exportToCsv', () => {
  it('produces valid CSV with header for an empty view', () => {
    const csv = exportToCsv([]);
    expect(csv).toBe(CSV_COLUMNS.join(','));
  });

  it('formats rows into CSV lines', () => {
    const rows = [makeEntry('USDC', 'EURC', '1000', 123456789)];
    const csv = exportToCsv(rows);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Saved At,Source,Destination,Amount');
    expect(lines[1]).toBe('123456789,USDC,EURC,1000');
  });

  it('respects active filter when derived from applyViewState', () => {
    // Filter by 'EURC'
    const view = { ...DEFAULT_VIEW_STATE, filter: 'EURC' };
    const derived = applyViewState(mockHistory, view);

    const csv = exportToCsv(derived.rows);
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(2); // Header + 1 matched entry
    expect(lines[1]).toContain('USDC,EURC,1000');
    expect(csv).not.toContain('NGN');
    expect(csv).not.toContain('BTC');
  });
});

describe('exportToJson', () => {
  it('round-trips JSON export cleanly', () => {
    const json = exportToJson(mockHistory);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(mockHistory);
  });

  it('handles empty view -> valid empty JSON array', () => {
    const json = exportToJson([]);
    expect(JSON.parse(json)).toEqual([]);
  });

  it('respects active filter when derived from applyViewState', () => {
    const view = { ...DEFAULT_VIEW_STATE, filter: 'USDC' };
    const derived = applyViewState(mockHistory, view);

    const json = exportToJson(derived.rows);
    const parsed = JSON.parse(json);
    expect(parsed.length).toBe(derived.rows.length);
    for (const item of parsed) {
      const matches = item.source.includes('USDC') || item.dest.includes('USDC');
      expect(matches).toBe(true);
    }
  });
});

describe('triggerDownload', () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;

  beforeEach(() => {
    createObjectURLMock = jest.fn().mockReturnValue('blob:http://localhost/test-uuid');
    revokeObjectURLMock = jest.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
  });

  it('creates an anchor, clicks it, and cleans up', () => {
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    triggerDownload('test-content', 'export.csv', 'text/csv;charset=utf-8;');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
