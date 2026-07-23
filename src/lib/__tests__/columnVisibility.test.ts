import {
  COLUMN_IDS,
  COLUMN_LABELS,
  DEFAULT_COLUMN_VISIBILITY,
  STORAGE_KEY,
  isColumnVisibility,
  resolveColumnVisibility,
  type ColumnVisibility,
} from '../columnVisibility';

describe('COLUMN_IDS', () => {
  it('contains source, destination, and actions', () => {
    expect(COLUMN_IDS).toEqual(['source', 'destination', 'actions']);
  });
});

describe('COLUMN_LABELS', () => {
  it('has a label for every column id', () => {
    for (const id of COLUMN_IDS) {
      expect(typeof COLUMN_LABELS[id]).toBe('string');
      expect(COLUMN_LABELS[id].length).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_COLUMN_VISIBILITY', () => {
  it('has all columns visible by default', () => {
    expect(DEFAULT_COLUMN_VISIBILITY).toEqual({
      source: true,
      destination: true,
      actions: true,
    });
  });
});

describe('STORAGE_KEY', () => {
  it('is a namespaced key', () => {
    expect(STORAGE_KEY).toMatch(/^stableroute:/);
  });
});

// ---------------------------------------------------------------------------
// isColumnVisibility
// ---------------------------------------------------------------------------

describe('isColumnVisibility', () => {
  it('accepts a valid visibility map', () => {
    expect(
      isColumnVisibility({ source: true, destination: false, actions: true })
    ).toBe(true);
  });

  it('accepts an empty object (no columns toggled yet)', () => {
    expect(isColumnVisibility({})).toBe(true);
  });

  it('accepts a partial map with only some keys', () => {
    expect(isColumnVisibility({ source: true })).toBe(true);
  });

  it('rejects null', () => {
    expect(isColumnVisibility(null)).toBe(false);
  });

  it('rejects an array', () => {
    expect(isColumnVisibility(['source'])).toBe(false);
  });

  it('rejects a string', () => {
    expect(isColumnVisibility('source')).toBe(false);
  });

  it('rejects a number', () => {
    expect(isColumnVisibility(42)).toBe(false);
  });

  it('rejects an object with a non-boolean value', () => {
    expect(isColumnVisibility({ source: 'yes' })).toBe(false);
  });

  it('rejects an object with an unknown key', () => {
    expect(isColumnVisibility({ source: true, unknown: true })).toBe(false);
  });

  it('rejects an object with a numeric value', () => {
    expect(isColumnVisibility({ source: 1 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolveColumnVisibility
// ---------------------------------------------------------------------------

describe('resolveColumnVisibility', () => {
  it('returns all-visible defaults when given null', () => {
    expect(resolveColumnVisibility(null)).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });

  it('returns all-visible defaults when given undefined', () => {
    expect(resolveColumnVisibility(undefined)).toEqual(
      DEFAULT_COLUMN_VISIBILITY
    );
  });

  it('merges stored values with defaults for missing keys', () => {
    const stored: ColumnVisibility = { source: false };
    const resolved = resolveColumnVisibility(stored);
    expect(resolved).toEqual({
      source: false,
      destination: true,
      actions: true,
    });
  });

  it('preserves all stored values when valid', () => {
    const stored: ColumnVisibility = {
      source: false,
      destination: false,
      actions: true,
    };
    expect(resolveColumnVisibility(stored)).toEqual(stored);
  });

  it('forces source visible when all columns would be hidden', () => {
    const stored: ColumnVisibility = {
      source: false,
      destination: false,
      actions: false,
    };
    const resolved = resolveColumnVisibility(stored);
    expect(resolved.source).toBe(true);
    expect(resolved.destination).toBe(false);
    expect(resolved.actions).toBe(false);
  });

  it('strips unknown keys and falls back to defaults', () => {
    // isColumnVisibility rejects unknown keys, so resolveColumnVisibility
    // should return defaults for a corrupt stored value.
    const corrupt = { source: true, bogus: false } as unknown as ColumnVisibility;
    const resolved = resolveColumnVisibility(corrupt);
    expect(resolved).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });

  it('falls back to defaults for a completely invalid shape', () => {
    expect(resolveColumnVisibility('invalid' as unknown)).toEqual(
      DEFAULT_COLUMN_VISIBILITY
    );
  });

  it('falls back to defaults for an array', () => {
    expect(resolveColumnVisibility(['source'] as unknown)).toEqual(
      DEFAULT_COLUMN_VISIBILITY
    );
  });

  it('falls back to defaults for a number', () => {
    expect(resolveColumnVisibility(42 as unknown)).toEqual(
      DEFAULT_COLUMN_VISIBILITY
    );
  });
});
