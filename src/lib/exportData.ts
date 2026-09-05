import type { HistoryEntry } from '@/app/quote/tableModel';

/**
 * Characters that can trigger formula execution in spreadsheet software
 * (Microsoft Excel, LibreOffice Calc, Google Sheets) when placed at the start of a cell.
 */
const FORMULA_TRIGGERS = ['=', '+', '-', '@'] as const;

/**
 * Escapes a single value for RFC 4180 CSV compliance and CSV formula-injection (DDE) safety:
 * 1. Stringifies null/undefined as empty string.
 * 2. If the value begins with a formula trigger (=, +, -, @), neutralizes it by prefixing a single quote (').
 * 3. If the value contains commas, double quotes, newlines, or was neutralized, encloses in double quotes with internal quotes escaped as "".
 */
export function escapeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return '';
  }
  let str = String(raw);

  const startsWithTrigger = FORMULA_TRIGGERS.some((char) => str.startsWith(char));
  if (startsWithTrigger) {
    str = `'${str}`;
  }

  const needsQuotes =
    startsWithTrigger ||
    str.includes('"') ||
    str.includes(',') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export const CSV_COLUMNS = ['Saved At', 'Source', 'Destination', 'Amount'] as const;

/**
 * Converts history entries to a clean, RFC 4180 compliant CSV string with formula safety.
 * Empty row list produces a valid CSV with just the header line.
 */
export function exportToCsv(rows: readonly HistoryEntry[]): string {
  const header = CSV_COLUMNS.map(escapeCsvCell).join(',');
  if (rows.length === 0) {
    return header;
  }

  const lines = [header];
  for (const row of rows) {
    const values = [
      row.savedAt,
      row.source,
      row.dest,
      row.amount,
    ];
    lines.push(values.map(escapeCsvCell).join(','));
  }

  return lines.join('\r\n');
}

/**
 * Converts history entries to formatted JSON.
 */
export function exportToJson(rows: readonly HistoryEntry[]): string {
  return JSON.stringify(rows, null, 2);
}

/**
 * Triggers a client-side file download using a Blob and ephemeral object URL.
 */
export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const createUrl = window.URL?.createObjectURL || URL?.createObjectURL;
  if (typeof createUrl !== 'function') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = createUrl(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Defer revocation so browser has initiated download stream
  setTimeout(() => {
    if (typeof window.URL?.revokeObjectURL === 'function') {
      window.URL.revokeObjectURL(url);
    }
  }, 100);
}
