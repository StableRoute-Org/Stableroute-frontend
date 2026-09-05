/**
 * Pure view-state logic for the swap-interface quotes table.
 *
 * The URL query string is the single source of truth for view state:
 * `parseViewState` reads it defensively (unknown or malformed values fall
 * back to defaults instead of throwing), `serializeViewState` writes only
 * non-default values back so URLs stay clean, and `applyViewState` derives
 * the visible rows. Keeping this module pure makes every rule unit-testable.
 */

export type QuoteInputs = {
  source: string;
  dest: string;
  amount: string;
};

export type HistoryEntry = QuoteInputs & { savedAt: number };

export type SortColumn = 'saved' | 'source' | 'dest' | 'amount';
export type SortDir = 'asc' | 'desc' | 'none';

export type TableViewState = {
  sort: SortColumn;
  dir: SortDir;
  /** Case-insensitive substring filter over source/dest asset codes. */
  filter: string;
  /** Exact source-asset filter; `'all'` disables it. */
  asset: string;
  /** 1-based page number. */
  page: number;
};

export type DerivedTable = {
  rows: HistoryEntry[];
  totalFiltered: number;
  page: number;
  totalPages: number;
};

/** History holds at most MAX_HISTORY entries, so 3 rows/page yields a real
 * multi-page experience without feeling sparse. */
export const PAGE_SIZE = 3;
export const DEBOUNCE_MS = 300;

export const SORT_COLUMNS: readonly SortColumn[] = [
  'saved',
  'source',
  'dest',
  'amount',
];
const SORT_DIRS: readonly SortDir[] = ['asc', 'desc', 'none'];

export const DEFAULT_VIEW_STATE: TableViewState = {
  sort: 'saved',
  dir: 'none',
  filter: '',
  asset: 'all',
  page: 1,
};

/** Query param names are prefixed with `q_` to never collide with the
 * quote-form prefill params (`source`, `dest`, …) used elsewhere. */
const PARAM_PREFIX = 'q_';

function readParam(
  params: URLSearchParams,
  key: string
): string | null {
  const value = params.get(`${PARAM_PREFIX}${key}`);
  return value === null || value === '' ? null : value;
}

/** Defensive parse: any invalid value silently falls back to its default so a
 * hand-edited or stale URL can never crash the table. */
export function parseViewState(params: URLSearchParams): TableViewState {
  const sortParam = readParam(params, 'sort');
  const dirParam = readParam(params, 'dir');
  const filterParam = readParam(params, 'filter');
  const assetParam = readParam(params, 'asset');
  const pageParam = readParam(params, 'page');

  const parsedPage = pageParam === null ? NaN : Number.parseInt(pageParam, 10);

  return {
    sort:
      sortParam !== null && (SORT_COLUMNS as readonly string[]).includes(sortParam)
        ? (sortParam as SortColumn)
        : DEFAULT_VIEW_STATE.sort,
    dir:
      dirParam !== null && (SORT_DIRS as readonly string[]).includes(dirParam)
        ? (dirParam as SortDir)
        : DEFAULT_VIEW_STATE.dir,
    filter:
      filterParam === null
        ? DEFAULT_VIEW_STATE.filter
        : // Cap length so pathological URLs cannot bloat state.
          filterParam.slice(0, 100),
    asset: assetParam ?? DEFAULT_VIEW_STATE.asset,
    page: Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
  };
}

/** Inverse of parseViewState: emits only values that differ from the defaults,
 * producing shareable URLs like `/quote?q_sort=amount&q_dir=asc`. */
export function serializeViewState(state: TableViewState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.sort !== DEFAULT_VIEW_STATE.sort) {
    params.set(`${PARAM_PREFIX}sort`, state.sort);
  }
  if (state.dir !== DEFAULT_VIEW_STATE.dir) {
    params.set(`${PARAM_PREFIX}dir`, state.dir);
  }
  if (state.filter !== DEFAULT_VIEW_STATE.filter) {
    params.set(`${PARAM_PREFIX}filter`, state.filter);
  }
  if (state.asset !== DEFAULT_VIEW_STATE.asset) {
    params.set(`${PARAM_PREFIX}asset`, state.asset);
  }
  if (state.page !== DEFAULT_VIEW_STATE.page) {
    params.set(`${PARAM_PREFIX}page`, String(state.page));
  }
  return params;
}

/**
 * Stable sort comparator helper: ties are broken by the entry's original
 * index, so equal keys always keep their relative order.
 */
function compareByColumn(
  a: HistoryEntry,
  b: HistoryEntry,
  column: SortColumn,
  dir: Exclude<SortDir, 'none'>,
  indexA: number,
  indexB: number
): number {
  let result: number;
  if (column === 'saved') {
    result = a.savedAt - b.savedAt;
  } else if (column === 'amount') {
    // Amounts are validated digit strings of unbounded length; comparing
    // length-first then lexicographically orders them exactly as integers
    // without Number() precision loss for very large values.
    result =
      a.amount.length !== b.amount.length
        ? a.amount.length - b.amount.length
        : a.amount < b.amount
          ? -1
          : a.amount > b.amount
            ? 1
            : 0;
  } else {
    const left = a[column].toLowerCase();
    const right = b[column].toLowerCase();
    result = left < right ? -1 : left > right ? 1 : 0;
  }
  if (result !== 0) {
    return dir === 'asc' ? result : -result;
  }
  return indexA - indexB;
}

/** Cycle used by header buttons: none → asc → desc → none. */
export function nextSortDir(current: SortDir): SortDir {
  switch (current) {
    case 'none':
      return 'asc';
    case 'asc':
      return 'desc';
    default:
      return 'none';
  }
}

/** Filter → stable-sort without pagination slice, used by CSV/JSON export to capture the full filtered view. */
export function getFilteredRows(
  rows: HistoryEntry[],
  state: TableViewState
): HistoryEntry[] {
  const needle = state.filter.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    const matchesText =
      needle === '' ||
      row.source.toLowerCase().includes(needle) ||
      row.dest.toLowerCase().includes(needle);
    const matchesAsset = state.asset === 'all' || row.source === state.asset;
    return matchesText && matchesAsset;
  });

  const { dir } = state;
  if (dir === 'none') {
    return filtered;
  }

  return filtered
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) =>
      compareByColumn(
        a.entry,
        b.entry,
        state.sort,
        dir,
        a.index,
        b.index
      )
    )
    .map(({ entry }) => entry);
}

/** Filter → stable-sort → paginate. Page is clamped into the valid range for
 * the filtered row count, so removing rows can never strand the view on an
 * out-of-range page. */
export function applyViewState(
  rows: HistoryEntry[],
  state: TableViewState
): DerivedTable {
  const sorted = getFilteredRows(rows, state);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, state.page), totalPages);

  return {
    rows: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    totalFiltered: sorted.length,
    page,
    totalPages,
  };
}

/** Distinct source assets present in the history, in first-seen order — feeds
 * the enum filter dropdown. */
export function distinctSources(rows: HistoryEntry[]): string[] {
  const seen: string[] = [];
  for (const row of rows) {
    if (!seen.includes(row.source)) {
      seen.push(row.source);
    }
  }
  return seen;
}
