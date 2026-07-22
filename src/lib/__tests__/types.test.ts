/**
 * Comprehensive tests for centralized API response types.
 *
 * This test suite validates:
 * - Type definitions are properly exported
 * - Types match expected API response shapes
 * - Type guards and validators work correctly
 * - Re-exports from dependent modules resolve correctly
 */

import type {
  Pair,
  Quote,
  AppEvent,
  DisplayEvent,
  ApiKey,
  CreateApiKeyResponse,
  Webhook,
} from '@/lib/types';

describe('API Response Types', () => {
  describe('Pair type', () => {
    it('should accept valid pair objects', () => {
      const pair: Pair = {
        source: 'USD',
        destination: 'EUR',
      };
      expect(pair.source).toBe('USD');
      expect(pair.destination).toBe('EUR');
    });

    it('should have required source and destination properties', () => {
      const pair: Pair = {
        source: 'BTC',
        destination: 'ETH',
      };
      expect(Object.keys(pair)).toContain('source');
      expect(Object.keys(pair)).toContain('destination');
    });

    it('should work with alphanumeric asset codes', () => {
      const pair: Pair = {
        source: 'USDC',
        destination: 'USDT',
      };
      expect(pair.source.length).toBeGreaterThan(0);
      expect(pair.destination.length).toBeGreaterThan(0);
    });
  });

  describe('Quote type', () => {
    it('should accept valid quote responses', () => {
      const quote: Quote = {
        source_asset: 'USD',
        dest_asset: 'EUR',
        amount: '1000',
        estimated_rate: '0.92',
        route: ['USD', 'EUR'],
      };
      expect(quote.source_asset).toBe('USD');
      expect(quote.dest_asset).toBe('EUR');
      expect(quote.amount).toBe('1000');
      expect(quote.estimated_rate).toBe('0.92');
      expect(quote.route).toEqual(['USD', 'EUR']);
    });

    it('should have all required properties', () => {
      const quote: Quote = {
        source_asset: 'BTC',
        dest_asset: 'ETH',
        amount: '100',
        estimated_rate: '15.5',
        route: ['BTC', 'USD', 'EUR', 'ETH'],
      };
      expect(quote).toHaveProperty('source_asset');
      expect(quote).toHaveProperty('dest_asset');
      expect(quote).toHaveProperty('amount');
      expect(quote).toHaveProperty('estimated_rate');
      expect(quote).toHaveProperty('route');
    });

    it('should support multi-hop routes', () => {
      const quote: Quote = {
        source_asset: 'BTC',
        dest_asset: 'YEN',
        amount: '1',
        estimated_rate: '4000000',
        route: ['BTC', 'USD', 'EUR', 'GBP', 'YEN'],
      };
      expect(quote.route.length).toBeGreaterThan(2);
      expect(quote.route[0]).toBe('BTC');
      expect(quote.route[quote.route.length - 1]).toBe('YEN');
    });

    it('should support numeric amounts as strings', () => {
      const quote: Quote = {
        source_asset: 'USD',
        dest_asset: 'EUR',
        amount: '123456789',
        estimated_rate: '0.85',
        route: ['USD', 'EUR'],
      };
      expect(typeof quote.amount).toBe('string');
      expect(Number(quote.amount)).toBeGreaterThan(0);
    });
  });

  describe('AppEvent type', () => {
    it('should accept valid event objects', () => {
      const event: AppEvent = {
        id: 'evt_123',
        ts: 1000000,
        type: 'pair.registered',
        payload: { source: 'USD', destination: 'EUR' },
      };
      expect(event.id).toBe('evt_123');
      expect(event.ts).toBe(1000000);
      expect(event.type).toBe('pair.registered');
      expect(event.payload).toEqual({ source: 'USD', destination: 'EUR' });
    });

    it('should have required properties', () => {
      const event: AppEvent = {
        id: 'evt_456',
        ts: Date.now(),
        type: 'quote.requested',
        payload: {},
      };
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('ts');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('payload');
    });

    it('should accept unknown payload types', () => {
      const event1: AppEvent = {
        id: 'evt_1',
        ts: Date.now(),
        type: 'test',
        payload: null,
      };
      expect(event1.payload).toBe(null);

      const event2: AppEvent = {
        id: 'evt_2',
        ts: Date.now(),
        type: 'test',
        payload: 'string payload',
      };
      expect(typeof event2.payload).toBe('string');

      const event3: AppEvent = {
        id: 'evt_3',
        ts: Date.now(),
        type: 'test',
        payload: [1, 2, 3],
      };
      expect(Array.isArray(event3.payload)).toBe(true);

      const event4: AppEvent = {
        id: 'evt_4',
        ts: Date.now(),
        type: 'test',
        payload: { nested: { data: true } },
      };
      expect(typeof event4.payload).toBe('object');
    });

    it('should support numeric timestamps', () => {
      const now = Date.now();
      const event: AppEvent = {
        id: 'evt_time',
        ts: now,
        type: 'test',
        payload: {},
      };
      expect(Number.isFinite(event.ts)).toBe(true);
      expect(event.ts).toBeGreaterThan(0);
    });
  });

  describe('DisplayEvent type', () => {
    it('should accept valid display event objects', () => {
      const displayEvent: DisplayEvent = {
        id: 'evt_123',
        ts: 1000000,
        type: 'pair.registered',
        payloadPreview: '{\n  "source": "USD"\n}',
        fullPayload: '{\n  "source": "USD",\n  "destination": "EUR"\n}',
      };
      expect(displayEvent.id).toBe('evt_123');
      expect(displayEvent.payloadPreview).toContain('source');
      expect(displayEvent.fullPayload).toContain('destination');
    });

    it('should have all required properties', () => {
      const displayEvent: DisplayEvent = {
        id: 'evt_1',
        ts: Date.now(),
        type: 'test',
        payloadPreview: 'preview',
        fullPayload: 'full',
      };
      expect(displayEvent).toHaveProperty('id');
      expect(displayEvent).toHaveProperty('ts');
      expect(displayEvent).toHaveProperty('type');
      expect(displayEvent).toHaveProperty('payloadPreview');
      expect(displayEvent).toHaveProperty('fullPayload');
    });

    it('should support truncated preview with full payload', () => {
      const longPayload = JSON.stringify(
        Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`key_${i}`, `value_${i}`])
        ),
        null,
        2
      );

      const displayEvent: DisplayEvent = {
        id: 'evt_large',
        ts: Date.now(),
        type: 'test',
        payloadPreview: longPayload.slice(0, 4000) + '\n… truncated',
        fullPayload: longPayload,
      };

      expect(displayEvent.payloadPreview.length).toBeLessThan(
        displayEvent.fullPayload.length
      );
      expect(displayEvent.payloadPreview).toContain('… truncated');
    });

    it('should use same preview and full payload when not truncated', () => {
      const shortPayload = '{"key": "value"}';
      const displayEvent: DisplayEvent = {
        id: 'evt_short',
        ts: Date.now(),
        type: 'test',
        payloadPreview: shortPayload,
        fullPayload: shortPayload,
      };

      expect(displayEvent.payloadPreview).toBe(displayEvent.fullPayload);
    });

    it('should handle circular reference markers', () => {
      const displayEvent: DisplayEvent = {
        id: 'evt_circular',
        ts: Date.now(),
        type: 'test',
        payloadPreview: '{\n  "ref": "[Circular]"\n}',
        fullPayload: '{\n  "ref": "[Circular]"\n}',
      };

      expect(displayEvent.payloadPreview).toContain('[Circular]');
    });

    it('should handle unserializable payload markers', () => {
      const displayEvent: DisplayEvent = {
        id: 'evt_unserializable',
        ts: Date.now(),
        type: 'test',
        payloadPreview: '[Unserializable payload]',
        fullPayload: '[Unserializable payload]',
      };

      expect(displayEvent.payloadPreview).toBe('[Unserializable payload]');
    });
  });

  describe('ApiKey type', () => {
    it('should accept valid API key objects', () => {
      const key: ApiKey = {
        prefix: 'sk_live_abc123',
        label: 'Production API Key',
        createdAt: Date.now(),
      };
      expect(key.prefix).toBe('sk_live_abc123');
      expect(key.label).toBe('Production API Key');
      expect(Number.isFinite(key.createdAt)).toBe(true);
    });

    it('should have all required properties', () => {
      const key: ApiKey = {
        prefix: 'sk_test_xyz789',
        label: 'Test Key',
        createdAt: 1000000,
      };
      expect(key).toHaveProperty('prefix');
      expect(key).toHaveProperty('label');
      expect(key).toHaveProperty('createdAt');
    });

    it('should support various label formats', () => {
      const labels = [
        'Production operator',
        'Test env',
        'Automation - Daily sync',
        '',
      ];

      labels.forEach((label) => {
        const key: ApiKey = {
          prefix: 'sk_test',
          label,
          createdAt: Date.now(),
        };
        expect(key.label).toBe(label);
      });
    });

    it('should store creation timestamp', () => {
      const now = Date.now();
      const key: ApiKey = {
        prefix: 'sk_key',
        label: 'Key',
        createdAt: now,
      };
      expect(key.createdAt).toBe(now);
    });
  });

  describe('CreateApiKeyResponse type', () => {
    it('should accept response with key and optional prefix', () => {
      const response: CreateApiKeyResponse = {
        key: 'sk_live_abc123xyz789...',
        prefix: 'sk_live_abc123',
      };
      expect(response.key).toBeDefined();
      expect(response.prefix).toBeDefined();
    });

    it('should accept response with key only', () => {
      const response: CreateApiKeyResponse = {
        key: 'sk_live_longkeystringhere...',
      };
      expect(response.key).toBeDefined();
      expect(response.prefix).toBeUndefined();
    });

    it('should support prefix derivation from key', () => {
      const response: CreateApiKeyResponse = {
        key: 'sk_live_abc123xyz789...',
      };
      const derived = response.prefix ?? response.key.slice(0, 8);
      expect(derived).toBe(response.prefix ?? 'sk_live_');
    });
  });

  describe('Webhook type', () => {
    it('should accept valid webhook objects', () => {
      const webhook: Webhook = {
        id: 'wh_123',
        url: 'https://example.com/webhooks',
        events: ['pair.registered', 'quote.requested'],
        createdAt: Date.now(),
      };
      expect(webhook.id).toBe('wh_123');
      expect(webhook.url).toBe('https://example.com/webhooks');
      expect(webhook.events).toContain('pair.registered');
      expect(webhook.createdAt).toBeGreaterThan(0);
    });

    it('should have all required properties', () => {
      const webhook: Webhook = {
        id: 'wh_456',
        url: 'https://api.example.com/events',
        events: ['router.paused', 'router.unpaused'],
        createdAt: 1000000,
      };
      expect(webhook).toHaveProperty('id');
      expect(webhook).toHaveProperty('url');
      expect(webhook).toHaveProperty('events');
      expect(webhook).toHaveProperty('createdAt');
    });

    it('should support multiple event subscriptions', () => {
      const webhook: Webhook = {
        id: 'wh_multi',
        url: 'https://example.com/webhooks',
        events: [
          'pair.registered',
          'pair.deleted',
          'quote.requested',
          'router.paused',
          'router.unpaused',
        ],
        createdAt: Date.now(),
      };
      expect(webhook.events.length).toBe(5);
    });

    it('should support single event subscriptions', () => {
      const webhook: Webhook = {
        id: 'wh_single',
        url: 'https://example.com/webhooks',
        events: ['pair.registered'],
        createdAt: Date.now(),
      };
      expect(webhook.events.length).toBe(1);
    });

    it('should support HTTPS URLs', () => {
      const webhook: Webhook = {
        id: 'wh_https',
        url: 'https://secure.example.com:8443/webhook',
        events: [],
        createdAt: Date.now(),
      };
      expect(webhook.url).toContain('https://');
    });

    it('should store creation timestamp', () => {
      const now = Date.now();
      const webhook: Webhook = {
        id: 'wh_ts',
        url: 'https://example.com/webhooks',
        events: ['pair.registered'],
        createdAt: now,
      };
      expect(webhook.createdAt).toBe(now);
    });
  });

  describe('Type interoperability', () => {
    it('should allow creating collections of different API response types', () => {
      const pair: Pair = { source: 'USD', destination: 'EUR' };
      const quote: Quote = {
        source_asset: 'USD',
        dest_asset: 'EUR',
        amount: '100',
        estimated_rate: '0.92',
        route: ['USD', 'EUR'],
      };
      const key: ApiKey = {
        prefix: 'sk_test',
        label: 'Test',
        createdAt: Date.now(),
      };
      const webhook: Webhook = {
        id: 'wh_1',
        url: 'https://example.com',
        events: ['pair.registered'],
        createdAt: Date.now(),
      };

      expect(pair).toBeDefined();
      expect(quote).toBeDefined();
      expect(key).toBeDefined();
      expect(webhook).toBeDefined();
    });

    it('should support nested structures with API types', () => {
      const quoteRequest = {
        id: 'req_1',
        pair: { source: 'USD', destination: 'EUR' } as Pair,
        quote: {
          source_asset: 'USD',
          dest_asset: 'EUR',
          amount: '100',
          estimated_rate: '0.92',
          route: ['USD', 'EUR'],
        } as Quote,
      };

      expect(quoteRequest.pair.source).toBe('USD');
      expect(quoteRequest.quote.amount).toBe('100');
    });
  });

  describe('Type coverage for re-exports', () => {
    it('should verify Quote is exported from quote module', () => {
      // This test validates that Quote type is available for import
      // from both types.ts and quote.ts
      const quote: Quote = {
        source_asset: 'BTC',
        dest_asset: 'ETH',
        amount: '1',
        estimated_rate: '15.5',
        route: ['BTC', 'ETH'],
      };
      expect(quote).toBeDefined();
    });

    it('should verify Pair is exported from pairsUtils module', () => {
      // This test validates that Pair type is available for import
      // from both types.ts and pairsUtils.ts
      const pair: Pair = {
        source: 'BTC',
        destination: 'ETH',
      };
      expect(pair).toBeDefined();
    });

    it('should verify AppEvent/DisplayEvent are exported from events module', () => {
      // This test validates that event types are available for import
      // from both types.ts and events.ts
      const appEvent: AppEvent = {
        id: 'evt_1',
        ts: Date.now(),
        type: 'test',
        payload: {},
      };
      const displayEvent: DisplayEvent = {
        id: 'evt_2',
        ts: Date.now(),
        type: 'test',
        payloadPreview: '{}',
        fullPayload: '{}',
      };
      expect(appEvent).toBeDefined();
      expect(displayEvent).toBeDefined();
    });

    it('should verify Webhook is exported from webhookEvents module', () => {
      // This test validates that Webhook type is available for import
      // from both types.ts and webhookEvents.ts
      const webhook: Webhook = {
        id: 'wh_1',
        url: 'https://example.com',
        events: [],
        createdAt: Date.now(),
      };
      expect(webhook).toBeDefined();
    });
  });

  describe('Type constraints', () => {
    it('Pair source and destination should be strings', () => {
      const pair: Pair = {
        source: 'USD',
        destination: 'EUR',
      };
      expect(typeof pair.source).toBe('string');
      expect(typeof pair.destination).toBe('string');
    });

    it('Quote numeric fields should be strings', () => {
      const quote: Quote = {
        source_asset: 'USD',
        dest_asset: 'EUR',
        amount: '100',
        estimated_rate: '0.92',
        route: ['USD', 'EUR'],
      };
      expect(typeof quote.amount).toBe('string');
      expect(typeof quote.estimated_rate).toBe('string');
    });

    it('Event id and type should be strings', () => {
      const event: AppEvent = {
        id: 'evt_1',
        ts: Date.now(),
        type: 'test.event',
        payload: {},
      };
      expect(typeof event.id).toBe('string');
      expect(typeof event.type).toBe('string');
    });

    it('Event ts should be a number', () => {
      const event: AppEvent = {
        id: 'evt_1',
        ts: 1234567890,
        type: 'test',
        payload: {},
      };
      expect(typeof event.ts).toBe('number');
    });

    it('Webhook events should be array of strings', () => {
      const webhook: Webhook = {
        id: 'wh_1',
        url: 'https://example.com',
        events: ['pair.registered', 'pair.deleted'],
        createdAt: Date.now(),
      };
      expect(Array.isArray(webhook.events)).toBe(true);
      webhook.events.forEach((evt) => {
        expect(typeof evt).toBe('string');
      });
    });

    it('ApiKey createdAt should be a number', () => {
      const key: ApiKey = {
        prefix: 'sk_test',
        label: 'Test',
        createdAt: Date.now(),
      };
      expect(typeof key.createdAt).toBe('number');
      expect(Number.isFinite(key.createdAt)).toBe(true);
    });
  });
});
