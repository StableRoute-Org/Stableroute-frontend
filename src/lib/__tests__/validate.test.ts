import {
  describeType,
  ValidationError,
  isPair,
  parsePair,
  isQuote,
  parseQuote,
  isApiKey,
  parseApiKey,
  isCreateApiKeyResponse,
  parseCreateApiKeyResponse,
  isWebhook,
  parseWebhook,
  isRouterStatus,
  parseRouterStatus,
  isStats,
  parseStats,
  isPairsResponse,
  parsePairsResponse,
  isApiKeyListResponse,
  parseApiKeyListResponse,
  isWebhookListResponse,
  parseWebhookListResponse,
} from '@/lib/validate';

// ---------------------------------------------------------------------------
// describeType
// ---------------------------------------------------------------------------

describe('describeType', () => {
  it('returns "null" for null', () => {
    expect(describeType(null)).toBe('null');
  });
  it('returns "array" for arrays', () => {
    expect(describeType([])).toBe('array');
    expect(describeType([1, 2, 3])).toBe('array');
  });
  it('returns "object" for plain objects', () => {
    expect(describeType({})).toBe('object');
  });
  it('returns "string" for strings', () => {
    expect(describeType('hello')).toBe('string');
  });
  it('returns "number" for numbers', () => {
    expect(describeType(42)).toBe('number');
  });
  it('returns "boolean" for booleans', () => {
    expect(describeType(true)).toBe('boolean');
  });
  it('returns "undefined" for undefined', () => {
    expect(describeType(undefined)).toBe('undefined');
  });
  it('returns "function" for functions', () => {
    expect(describeType(() => {})).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('has correct name and code', () => {
    const err = new ValidationError('msg', 'root', 'string', 'number');
    expect(err.name).toBe('ValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
  });
  it('is an instance of Error', () => {
    const err = new ValidationError('msg', 'f', 'a', 'b');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ValidationError);
  });
  it('exposes field, expected, received', () => {
    const err = new ValidationError('bad', 'items[0].id', 'string', 'number');
    expect(err.field).toBe('items[0].id');
    expect(err.expected).toBe('string');
    expect(err.received).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// isPair / parsePair
// ---------------------------------------------------------------------------

describe('isPair', () => {
  it('accepts valid Pair', () => {
    expect(isPair({ source: 'USD', destination: 'EUR' })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isPair(null)).toBe(false);
    expect(isPair('string')).toBe(false);
    expect(isPair(42)).toBe(false);
    expect(isPair(undefined)).toBe(false);
  });
  it('rejects missing source', () => {
    expect(isPair({ destination: 'EUR' })).toBe(false);
  });
  it('rejects missing destination', () => {
    expect(isPair({ source: 'USD' })).toBe(false);
  });
  it('rejects non-string source', () => {
    expect(isPair({ source: 123, destination: 'EUR' })).toBe(false);
  });
  it('rejects non-string destination', () => {
    expect(isPair({ source: 'USD', destination: 123 })).toBe(false);
  });
  it('accepts extra properties', () => {
    expect(isPair({ source: 'USD', destination: 'EUR', extra: true })).toBe(
      true
    );
  });
});

describe('parsePair', () => {
  it('returns the Pair on valid input', () => {
    const input = { source: 'USD', destination: 'EUR' };
    expect(parsePair(input)).toEqual(input);
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parsePair(null)).toThrow(ValidationError);
    expect(() => parsePair(null)).toThrow('Expected object');
  });
  it('throws with correct field for missing source', () => {
    const err = (() => {
      try {
        parsePair({ destination: 'EUR' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('source');
    expect(err.expected).toBe('string');
  });
  it('throws with correct field for wrong destination type', () => {
    const err = (() => {
      try {
        parsePair({ source: 'USD', destination: 123 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('destination');
    expect(err.received).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// isQuote / parseQuote
// ---------------------------------------------------------------------------

const validQuote = {
  source_asset: 'USD',
  dest_asset: 'EUR',
  amount: '1000',
  estimated_rate: '0.92',
  route: ['USD', 'USDC', 'EUR'],
};

describe('isQuote', () => {
  it('accepts valid Quote', () => {
    expect(isQuote(validQuote)).toBe(true);
  });
  it('accepts empty route array', () => {
    expect(isQuote({ ...validQuote, route: [] })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isQuote(null)).toBe(false);
    expect(isQuote(42)).toBe(false);
  });
  it('rejects missing source_asset', () => {
    expect(isQuote({ ...validQuote, source_asset: undefined })).toBe(false);
  });
  it('rejects non-string source_asset', () => {
    expect(isQuote({ ...validQuote, source_asset: 123 })).toBe(false);
  });
  it('rejects non-string dest_asset', () => {
    expect(isQuote({ ...validQuote, dest_asset: 123 })).toBe(false);
  });
  it('rejects non-string amount', () => {
    expect(isQuote({ ...validQuote, amount: 1000 })).toBe(false);
  });
  it('rejects non-string estimated_rate', () => {
    expect(isQuote({ ...validQuote, estimated_rate: 0.92 })).toBe(false);
  });
  it('rejects non-array route', () => {
    expect(isQuote({ ...validQuote, route: 'USD' })).toBe(false);
  });
  it('rejects route with non-string elements', () => {
    expect(isQuote({ ...validQuote, route: ['USD', 123, 'EUR'] })).toBe(false);
  });
  it('rejects route with null elements', () => {
    expect(isQuote({ ...validQuote, route: [null] })).toBe(false);
  });
});

describe('parseQuote', () => {
  it('returns the Quote on valid input', () => {
    expect(parseQuote(validQuote)).toEqual(validQuote);
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parseQuote(null)).toThrow(ValidationError);
  });
  it('throws with field "source_asset" for bad source_asset', () => {
    const err = (() => {
      try {
        parseQuote({ ...validQuote, source_asset: 42 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('source_asset');
    expect(err.expected).toBe('string');
    expect(err.received).toBe('number');
  });
  it('throws with field "route" for non-array route', () => {
    const err = (() => {
      try {
        parseQuote({ ...validQuote, route: 'not-array' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('route');
    expect(err.expected).toBe('array');
  });
  it('throws with field "route" for mixed-type route', () => {
    const err = (() => {
      try {
        parseQuote({ ...validQuote, route: ['USD', 42] });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('route');
    expect(err.expected).toBe('string[]');
  });
  it('throws with field "dest_asset" for wrong type', () => {
    const err = (() => {
      try {
        parseQuote({ ...validQuote, dest_asset: 123 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('dest_asset');
    expect(err.received).toBe('number');
  });
  it('throws with field "amount" for wrong type', () => {
    const err = (() => {
      try {
        parseQuote({ ...validQuote, amount: true });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('amount');
    expect(err.received).toBe('boolean');
  });
  it('throws with field "estimated_rate" for wrong type', () => {
    const err = (() => {
      try {
        parseQuote({ ...validQuote, estimated_rate: [1] });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('estimated_rate');
    expect(err.received).toBe('array');
  });
});

// ---------------------------------------------------------------------------
// isApiKey / parseApiKey
// ---------------------------------------------------------------------------

const validApiKey = { prefix: 'sk_abc', label: 'Prod', createdAt: 1700000000 };

describe('isApiKey', () => {
  it('accepts valid ApiKey', () => {
    expect(isApiKey(validApiKey)).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isApiKey(null)).toBe(false);
    expect(isApiKey('string')).toBe(false);
  });
  it('rejects missing prefix', () => {
    expect(isApiKey({ label: 'Prod', createdAt: 1 })).toBe(false);
  });
  it('rejects non-string prefix', () => {
    expect(isApiKey({ ...validApiKey, prefix: 123 })).toBe(false);
  });
  it('rejects non-string label', () => {
    expect(isApiKey({ ...validApiKey, label: 123 })).toBe(false);
  });
  it('rejects non-number createdAt', () => {
    expect(isApiKey({ ...validApiKey, createdAt: 'now' })).toBe(false);
  });
  it('rejects NaN createdAt', () => {
    expect(isApiKey({ ...validApiKey, createdAt: NaN })).toBe(false);
  });
  it('rejects Infinity createdAt', () => {
    expect(isApiKey({ ...validApiKey, createdAt: Infinity })).toBe(false);
  });
  it('rejects null createdAt', () => {
    expect(isApiKey({ ...validApiKey, createdAt: null })).toBe(false);
  });
});

describe('parseApiKey', () => {
  it('returns the ApiKey on valid input', () => {
    expect(parseApiKey(validApiKey)).toEqual(validApiKey);
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parseApiKey(null)).toThrow(ValidationError);
  });
  it('throws with correct field for bad prefix', () => {
    const err = (() => {
      try {
        parseApiKey({ ...validApiKey, prefix: 42 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('prefix');
    expect(err.received).toBe('number');
  });
  it('throws with correct field for bad createdAt', () => {
    const err = (() => {
      try {
        parseApiKey({ ...validApiKey, createdAt: 'now' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('createdAt');
    expect(err.received).toBe('string');
  });
  it('throws with correct field for bad label', () => {
    const err = (() => {
      try {
        parseApiKey({ ...validApiKey, label: 42 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('label');
    expect(err.received).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// isCreateApiKeyResponse / parseCreateApiKeyResponse
// ---------------------------------------------------------------------------

const validCreateKey = { key: 'sk_live_abc123def456', prefix: 'sk_abc' };

describe('isCreateApiKeyResponse', () => {
  it('accepts valid response with prefix', () => {
    expect(isCreateApiKeyResponse(validCreateKey)).toBe(true);
  });
  it('accepts valid response without prefix', () => {
    expect(isCreateApiKeyResponse({ key: 'sk_live_abc123def456' })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isCreateApiKeyResponse(null)).toBe(false);
    expect(isCreateApiKeyResponse('string')).toBe(false);
  });
  it('rejects missing key', () => {
    expect(isCreateApiKeyResponse({ prefix: 'sk_abc' })).toBe(false);
  });
  it('rejects non-string key', () => {
    expect(isCreateApiKeyResponse({ key: 12345 })).toBe(false);
  });
  it('rejects non-string prefix when present', () => {
    expect(isCreateApiKeyResponse({ key: 'abc', prefix: 123 })).toBe(false);
  });
});

describe('parseCreateApiKeyResponse', () => {
  it('returns the response on valid input', () => {
    expect(parseCreateApiKeyResponse(validCreateKey)).toEqual(validCreateKey);
  });
  it('returns response without prefix', () => {
    expect(parseCreateApiKeyResponse({ key: 'abc' })).toEqual({ key: 'abc' });
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parseCreateApiKeyResponse(null)).toThrow(ValidationError);
  });
  it('throws with field "key" for wrong type', () => {
    const err = (() => {
      try {
        parseCreateApiKeyResponse({ key: 12345 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('key');
    expect(err.expected).toBe('string');
    expect(err.received).toBe('number');
  });
  it('throws with field "prefix" for wrong type', () => {
    const err = (() => {
      try {
        parseCreateApiKeyResponse({ key: 'abc', prefix: 123 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('prefix');
  });
});

// ---------------------------------------------------------------------------
// SENSITIVE-FIELD REGRESSION: CreateApiKeyResponse.key must never leak
// ---------------------------------------------------------------------------

describe('CreateApiKeyResponse sensitive-field leak prevention', () => {
  it('ValidationError never contains the raw key value', () => {
    const fakeKey = 'sk_live_SECRETVALUE_1234567890abcdef';
    let err: ValidationError | undefined;
    try {
      parseCreateApiKeyResponse({ key: 12345, prefix: 'sk_' });
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err).toBeDefined();
    const serialized = JSON.stringify(err);
    expect(serialized).not.toContain('12345');
    expect(serialized).not.toContain(fakeKey);
  });

  it('received field is always a type name, not a value', () => {
    let err: ValidationError | undefined;
    try {
      parseCreateApiKeyResponse({ key: [1, 2, 3] });
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err).toBeDefined();
    expect(err!.received).toBe('array');
    expect(err!.received).not.toContain('1');
    expect(err!.received).not.toContain('2');
    expect(err!.received).not.toContain('3');
  });

  it('field path is safe even when key is an object', () => {
    let err: ValidationError | undefined;
    try {
      parseCreateApiKeyResponse({ key: { nested: true } });
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err).toBeDefined();
    expect(err!.field).toBe('key');
    expect(err!.received).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// isWebhook / parseWebhook — with element-level event type validation
// ---------------------------------------------------------------------------

const validWebhook = {
  id: 'wh_1',
  url: 'https://example.com/hook',
  events: ['pair.registered', 'pair.deleted'],
  createdAt: 1700000000,
};

describe('isWebhook', () => {
  it('accepts valid Webhook', () => {
    expect(isWebhook(validWebhook)).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isWebhook(null)).toBe(false);
    expect(isWebhook('string')).toBe(false);
  });
  it('rejects missing id', () => {
    expect(isWebhook({ url: 'u', events: [], createdAt: 1 })).toBe(false);
  });
  it('rejects non-string id', () => {
    expect(isWebhook({ ...validWebhook, id: 42 })).toBe(false);
  });
  it('rejects non-string url', () => {
    expect(isWebhook({ ...validWebhook, url: 42 })).toBe(false);
  });
  it('rejects non-array events', () => {
    expect(isWebhook({ ...validWebhook, events: 'pair.registered' })).toBe(
      false
    );
  });
  it('rejects events with non-string elements', () => {
    expect(isWebhook({ ...validWebhook, events: [123] })).toBe(false);
  });
  it('rejects events with invalid event type strings', () => {
    expect(isWebhook({ ...validWebhook, events: ['not.a.real.event'] })).toBe(
      false
    );
  });
  it('rejects events with null elements', () => {
    expect(isWebhook({ ...validWebhook, events: [null] })).toBe(false);
  });
  it('rejects events with mixed valid and invalid', () => {
    expect(
      isWebhook({
        ...validWebhook,
        events: ['pair.registered', 'bogus_event'],
      })
    ).toBe(false);
  });
  it('rejects non-number createdAt', () => {
    expect(isWebhook({ ...validWebhook, createdAt: 'now' })).toBe(false);
  });
  it('rejects NaN createdAt', () => {
    expect(isWebhook({ ...validWebhook, createdAt: NaN })).toBe(false);
  });
  it('accepts empty events array', () => {
    expect(isWebhook({ ...validWebhook, events: [] })).toBe(true);
  });
  it('accepts all five valid event types', () => {
    expect(
      isWebhook({
        ...validWebhook,
        events: [
          'pair.registered',
          'pair.deleted',
          'quote.requested',
          'router.paused',
          'router.unpaused',
        ],
      })
    ).toBe(true);
  });
});

describe('parseWebhook', () => {
  it('returns the Webhook on valid input', () => {
    expect(parseWebhook(validWebhook)).toEqual(validWebhook);
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parseWebhook(null)).toThrow(ValidationError);
  });
  it('throws with field "events" for non-array', () => {
    const err = (() => {
      try {
        parseWebhook({ ...validWebhook, events: 'not-array' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('events');
    expect(err.expected).toBe('array');
  });
  it('throws with field "id" for wrong type', () => {
    const err = (() => {
      try {
        parseWebhook({ ...validWebhook, id: 123 });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('id');
    expect(err.received).toBe('number');
  });
  it('throws with field "url" for wrong type', () => {
    const err = (() => {
      try {
        parseWebhook({ ...validWebhook, url: false });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('url');
    expect(err.received).toBe('boolean');
  });
  it('throws with correct index for invalid event type', () => {
    const err = (() => {
      try {
        parseWebhook({
          ...validWebhook,
          events: ['pair.registered', 'bogus', 'pair.deleted'],
        });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('events[1]');
    expect(err.expected).toBe('webhook_event_type');
  });
  it('throws with correct index for non-string event', () => {
    const err = (() => {
      try {
        parseWebhook({
          ...validWebhook,
          events: ['pair.registered', 123],
        });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('events[1]');
    expect(err.received).toBe('number');
  });
  it('throws with field "createdAt" for bad createdAt', () => {
    const err = (() => {
      try {
        parseWebhook({ ...validWebhook, createdAt: null });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('createdAt');
  });
});

// ---------------------------------------------------------------------------
// isRouterStatus / parseRouterStatus
// ---------------------------------------------------------------------------

describe('isRouterStatus', () => {
  it('accepts { paused: true }', () => {
    expect(isRouterStatus({ paused: true })).toBe(true);
  });
  it('accepts { paused: false }', () => {
    expect(isRouterStatus({ paused: false })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isRouterStatus(null)).toBe(false);
    expect(isRouterStatus(42)).toBe(false);
  });
  it('rejects non-boolean paused', () => {
    expect(isRouterStatus({ paused: 1 })).toBe(false);
    expect(isRouterStatus({ paused: 'true' })).toBe(false);
  });
  it('rejects missing paused', () => {
    expect(isRouterStatus({})).toBe(false);
  });
});

describe('parseRouterStatus', () => {
  it('returns the RouterStatus on valid input', () => {
    expect(parseRouterStatus({ paused: false })).toEqual({ paused: false });
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parseRouterStatus(null)).toThrow(ValidationError);
  });
  it('throws with field "paused" for wrong type', () => {
    const err = (() => {
      try {
        parseRouterStatus({ paused: 'yes' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('paused');
    expect(err.expected).toBe('boolean');
    expect(err.received).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// isStats / parseStats
// ---------------------------------------------------------------------------

const validStats = { totalPairs: 42, paused: false };

describe('isStats', () => {
  it('accepts valid Stats', () => {
    expect(isStats(validStats)).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isStats(null)).toBe(false);
  });
  it('rejects non-number totalPairs', () => {
    expect(isStats({ ...validStats, totalPairs: '42' })).toBe(false);
  });
  it('rejects NaN totalPairs', () => {
    expect(isStats({ ...validStats, totalPairs: NaN })).toBe(false);
  });
  it('rejects Infinity totalPairs', () => {
    expect(isStats({ ...validStats, totalPairs: Infinity })).toBe(false);
  });
  it('rejects non-boolean paused', () => {
    expect(isStats({ ...validStats, paused: 0 })).toBe(false);
  });
  it('rejects missing totalPairs', () => {
    expect(isStats({ paused: false })).toBe(false);
  });
  it('rejects missing paused', () => {
    expect(isStats({ totalPairs: 1 })).toBe(false);
  });
  it('accepts totalPairs of 0', () => {
    expect(isStats({ totalPairs: 0, paused: false })).toBe(true);
  });
});

describe('parseStats', () => {
  it('returns the Stats on valid input', () => {
    expect(parseStats(validStats)).toEqual(validStats);
  });
  it('throws ValidationError on non-object', () => {
    expect(() => parseStats(undefined)).toThrow(ValidationError);
  });
  it('throws with field "totalPairs" for wrong type', () => {
    const err = (() => {
      try {
        parseStats({ totalPairs: '42', paused: false });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('totalPairs');
    expect(err.received).toBe('string');
  });
  it('throws with field "paused" for wrong type', () => {
    const err = (() => {
      try {
        parseStats({ totalPairs: 1, paused: 'yes' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('paused');
    expect(err.received).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// isPairsResponse / parsePairsResponse
// ---------------------------------------------------------------------------

describe('isPairsResponse', () => {
  it('accepts valid pairs response', () => {
    expect(
      isPairsResponse({ pairs: [{ source: 'USD', destination: 'EUR' }] })
    ).toBe(true);
  });
  it('accepts empty pairs', () => {
    expect(isPairsResponse({ pairs: [] })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isPairsResponse(null)).toBe(false);
  });
  it('rejects non-array pairs', () => {
    expect(isPairsResponse({ pairs: 'not-array' })).toBe(false);
  });
  it('rejects pairs with invalid items', () => {
    expect(isPairsResponse({ pairs: [{ source: 'USD' }] })).toBe(false);
  });
});

describe('parsePairsResponse', () => {
  it('returns valid pairs response', () => {
    const input = { pairs: [{ source: 'USD', destination: 'EUR' }] };
    expect(parsePairsResponse(input)).toEqual(input);
  });
  it('throws on non-object', () => {
    expect(() => parsePairsResponse(null)).toThrow(ValidationError);
  });
  it('throws on non-array pairs', () => {
    const err = (() => {
      try {
        parsePairsResponse({ pairs: 'bad' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('pairs');
  });
  it('throws with correct index for invalid pair', () => {
    const err = (() => {
      try {
        parsePairsResponse({
          pairs: [{ source: 'USD', destination: 'EUR' }, { source: 123 }],
        });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('pairs[1]');
    expect(err.expected).toBe('Pair');
  });
});

// ---------------------------------------------------------------------------
// isApiKeyListResponse / parseApiKeyListResponse
// ---------------------------------------------------------------------------

describe('isApiKeyListResponse', () => {
  it('accepts valid response', () => {
    expect(
      isApiKeyListResponse({
        items: [{ prefix: 'sk_a', label: 'P', createdAt: 1 }],
      })
    ).toBe(true);
  });
  it('accepts empty items', () => {
    expect(isApiKeyListResponse({ items: [] })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isApiKeyListResponse(null)).toBe(false);
  });
  it('rejects non-array items', () => {
    expect(isApiKeyListResponse({ items: 'bad' })).toBe(false);
  });
  it('rejects items with invalid elements', () => {
    expect(isApiKeyListResponse({ items: [{ prefix: 123 }] })).toBe(false);
  });
});

describe('parseApiKeyListResponse', () => {
  it('returns valid response', () => {
    const input = {
      items: [{ prefix: 'sk_a', label: 'P', createdAt: 1 }],
    };
    expect(parseApiKeyListResponse(input)).toEqual(input);
  });
  it('throws on non-object', () => {
    expect(() => parseApiKeyListResponse(null)).toThrow(ValidationError);
  });
  it('throws on non-array items', () => {
    const err = (() => {
      try {
        parseApiKeyListResponse({ items: 'bad' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('items');
  });
  it('throws with correct index for invalid ApiKey', () => {
    const err = (() => {
      try {
        parseApiKeyListResponse({
          items: [{ prefix: 'sk_a', label: 'P', createdAt: 1 }, { prefix: 42 }],
        });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('items[1]');
    expect(err.expected).toBe('ApiKey');
  });
});

// ---------------------------------------------------------------------------
// isWebhookListResponse / parseWebhookListResponse
// ---------------------------------------------------------------------------

describe('isWebhookListResponse', () => {
  it('accepts valid response', () => {
    expect(
      isWebhookListResponse({
        items: [validWebhook],
      })
    ).toBe(true);
  });
  it('accepts empty items', () => {
    expect(isWebhookListResponse({ items: [] })).toBe(true);
  });
  it('rejects non-object', () => {
    expect(isWebhookListResponse(null)).toBe(false);
  });
  it('rejects non-array items', () => {
    expect(isWebhookListResponse({ items: 'bad' })).toBe(false);
  });
  it('rejects items with invalid webhooks', () => {
    expect(isWebhookListResponse({ items: [{ id: 123 }] })).toBe(false);
  });
  it('rejects items with invalid event types', () => {
    expect(
      isWebhookListResponse({
        items: [
          {
            id: 'wh_1',
            url: 'https://example.com',
            events: ['bogus_event'],
            createdAt: 1,
          },
        ],
      })
    ).toBe(false);
  });
});

describe('parseWebhookListResponse', () => {
  it('returns valid response', () => {
    const input = { items: [validWebhook] };
    expect(parseWebhookListResponse(input)).toEqual(input);
  });
  it('throws on non-object', () => {
    expect(() => parseWebhookListResponse(null)).toThrow(ValidationError);
  });
  it('throws on non-array items', () => {
    const err = (() => {
      try {
        parseWebhookListResponse({ items: 'bad' });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('items');
  });
  it('throws with correct index for invalid Webhook', () => {
    const err = (() => {
      try {
        parseWebhookListResponse({
          items: [validWebhook, { id: 123 }],
        });
      } catch (e) {
        return e;
      }
    })() as ValidationError;
    expect(err.field).toBe('items[1]');
    expect(err.expected).toBe('Webhook');
  });
});

// ---------------------------------------------------------------------------
// Shallow array regression: Quote.route and Webhook.events
// ---------------------------------------------------------------------------

describe('Quote.route element validation', () => {
  it('rejects route with numeric elements', () => {
    expect(isQuote({ ...validQuote, route: [42] })).toBe(false);
  });
  it('rejects route with null elements', () => {
    expect(isQuote({ ...validQuote, route: [null] })).toBe(false);
  });
  it('rejects route with object elements', () => {
    expect(isQuote({ ...validQuote, route: [{}] })).toBe(false);
  });
  it('rejects route with boolean elements', () => {
    expect(isQuote({ ...validQuote, route: [true] })).toBe(false);
  });
  it('accepts route with only valid strings', () => {
    expect(isQuote({ ...validQuote, route: ['a', 'b', 'c'] })).toBe(true);
  });
});

describe('Webhook.events element validation', () => {
  it('rejects events with numeric elements', () => {
    expect(isWebhook({ ...validWebhook, events: [123] })).toBe(false);
  });
  it('rejects events with null elements', () => {
    expect(isWebhook({ ...validWebhook, events: [null] })).toBe(false);
  });
  it('rejects events with unknown string types', () => {
    expect(isWebhook({ ...validWebhook, events: ['unknown.event'] })).toBe(
      false
    );
  });
  it('rejects events with object elements', () => {
    expect(isWebhook({ ...validWebhook, events: [{}] })).toBe(false);
  });
  it('accepts events with all valid types', () => {
    expect(
      isWebhook({
        ...validWebhook,
        events: [
          'pair.registered',
          'pair.deleted',
          'quote.requested',
          'router.paused',
          'router.unpaused',
        ],
      })
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Generic edge cases across all validators
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('rejects arrays passed to object validators', () => {
    expect(isPair([1, 2])).toBe(false);
    expect(isQuote([1, 2])).toBe(false);
    expect(isApiKey([1, 2])).toBe(false);
    expect(isWebhook([1, 2])).toBe(false);
    expect(isRouterStatus([1, 2])).toBe(false);
    expect(isStats([1, 2])).toBe(false);
  });

  it('rejects functions passed to object validators', () => {
    const fn = () => {};
    expect(isPair(fn)).toBe(false);
    expect(isQuote(fn)).toBe(false);
    expect(isApiKey(fn)).toBe(false);
    expect(isWebhook(fn)).toBe(false);
    expect(isRouterStatus(fn)).toBe(false);
    expect(isStats(fn)).toBe(false);
  });

  it('rejects empty objects for validators with required fields', () => {
    expect(isPair({})).toBe(false);
    expect(isApiKey({})).toBe(false);
    expect(isRouterStatus({})).toBe(false);
    expect(isStats({})).toBe(false);
  });
});
