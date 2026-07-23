'use strict';

/**
 * Tests for .lighthouserc.json
 *
 * Validates that the committed Lighthouse CI configuration:
 *  - Is valid JSON and matches the expected schema
 *  - Audits exactly the required routes
 *  - Declares thresholds that are tight enough to catch regressions
 *  - Configures artifact upload so HTML reports are preserved
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Load and parse .lighthouserc.json from the repo root. */
function loadConfig() {
  const configPath = path.resolve(__dirname, '../../.lighthouserc.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REQUIRED_ROUTES = [
  'http://localhost:3000/',
  'http://localhost:3000/pairs',
  'http://localhost:3000/events',
  'http://localhost:3000/docs',
];

// Assertions that must fail the job on breach (error severity)
const REQUIRED_ERROR_ASSERTIONS = {
  'categories:performance': 0.8,
  'categories:accessibility': 0.9,
  'categories:best-practices': 0.8,
  'categories:seo': 0.8,
  'largest-contentful-paint': 2500,
  'cumulative-layout-shift': 0.1,
};

// Assertions that must at least be present (warn is acceptable)
const REQUIRED_PRESENT_ASSERTIONS = [
  'first-contentful-paint',
  'total-blocking-time',
  'interactive',
];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('.lighthouserc.json', () => {
  let config;

  beforeAll(() => {
    config = loadConfig();
  });

  // -------------------------------------------------------------------------
  // Top-level structure
  // -------------------------------------------------------------------------

  describe('top-level structure', () => {
    it('has a ci key at the root', () => {
      expect(config).toHaveProperty('ci');
      expect(typeof config.ci).toBe('object');
    });

    it('has collect, assert, and upload sections under ci', () => {
      expect(config.ci).toHaveProperty('collect');
      expect(config.ci).toHaveProperty('assert');
      expect(config.ci).toHaveProperty('upload');
    });
  });

  // -------------------------------------------------------------------------
  // collect section
  // -------------------------------------------------------------------------

  describe('ci.collect', () => {
    let collect;

    beforeAll(() => {
      collect = config.ci.collect;
    });

    it('defines a url array', () => {
      expect(Array.isArray(collect.url)).toBe(true);
      expect(collect.url.length).toBeGreaterThan(0);
    });

    it('audits exactly the four required routes', () => {
      expect(collect.url).toHaveLength(REQUIRED_ROUTES.length);
      for (const route of REQUIRED_ROUTES) {
        expect(collect.url).toContain(route);
      }
    });

    it('all URLs target localhost:3000', () => {
      for (const url of collect.url) {
        expect(url).toMatch(/^http:\/\/localhost:3000/);
      }
    });

    it('specifies startServerCommand', () => {
      expect(typeof collect.startServerCommand).toBe('string');
      expect(collect.startServerCommand.trim()).not.toBe('');
    });

    it('starts the server with npm start', () => {
      expect(collect.startServerCommand).toBe('npm start');
    });

    it('specifies startServerReadyPattern', () => {
      expect(typeof collect.startServerReadyPattern).toBe('string');
      expect(collect.startServerReadyPattern.trim()).not.toBe('');
    });

    it('uses a ready pattern that matches Next.js output', () => {
      // Next.js prints "Ready on http://..." — ensure pattern matches
      const pattern = new RegExp(collect.startServerReadyPattern);
      expect(pattern.test('Ready on http://localhost:3000')).toBe(true);
    });

    it('has a startServerReadyTimeout greater than zero', () => {
      expect(typeof collect.startServerReadyTimeout).toBe('number');
      expect(collect.startServerReadyTimeout).toBeGreaterThan(0);
    });

    it('sets numberOfRuns to a positive integer', () => {
      expect(typeof collect.numberOfRuns).toBe('number');
      expect(collect.numberOfRuns).toBeGreaterThanOrEqual(1);
    });

    it('uses the desktop preset or desktop formFactor', () => {
      const settings = collect.settings || {};
      const isDesktop =
        settings.preset === 'desktop' ||
        settings.formFactor === 'desktop' ||
        (settings.screenEmulation && settings.screenEmulation.mobile === false);
      expect(isDesktop).toBe(true);
    });

    it('does not use the mobile preset', () => {
      const settings = collect.settings || {};
      expect(settings.preset).not.toBe('mobile');
      expect(settings.formFactor).not.toBe('mobile');
    });
  });

  // -------------------------------------------------------------------------
  // assert section
  // -------------------------------------------------------------------------

  describe('ci.assert', () => {
    let assertions;

    beforeAll(() => {
      assertions = config.ci.assert.assertions;
    });

    it('defines an assertions object', () => {
      expect(typeof assertions).toBe('object');
      expect(assertions).not.toBeNull();
    });

    // Category score error assertions
    describe('category score thresholds (error severity)', () => {
      for (const [key, minScore] of Object.entries(REQUIRED_ERROR_ASSERTIONS)) {
        // Skip numeric audits in this loop — they use maxNumericValue
        if (key.startsWith('categories:')) {
          it(`${key} is present and set to error severity`, () => {
            expect(assertions).toHaveProperty(key);
            const [severity] = assertions[key];
            expect(severity).toBe('error');
          });

          it(`${key} minScore is at least ${minScore}`, () => {
            const [, opts] = assertions[key];
            expect(opts).toHaveProperty('minScore');
            expect(opts.minScore).toBeGreaterThanOrEqual(minScore);
          });
        }
      }
    });

    // Numeric metric error assertions
    describe('Core Web Vital thresholds (error severity)', () => {
      it('largest-contentful-paint is an error assertion', () => {
        expect(assertions).toHaveProperty('largest-contentful-paint');
        const [severity] = assertions['largest-contentful-paint'];
        expect(severity).toBe('error');
      });

      it('largest-contentful-paint maxNumericValue ≤ 2500 ms', () => {
        const [, opts] = assertions['largest-contentful-paint'];
        expect(opts).toHaveProperty('maxNumericValue');
        expect(opts.maxNumericValue).toBeLessThanOrEqual(2500);
      });

      it('cumulative-layout-shift is an error assertion', () => {
        expect(assertions).toHaveProperty('cumulative-layout-shift');
        const [severity] = assertions['cumulative-layout-shift'];
        expect(severity).toBe('error');
      });

      it('cumulative-layout-shift maxNumericValue ≤ 0.1', () => {
        const [, opts] = assertions['cumulative-layout-shift'];
        expect(opts).toHaveProperty('maxNumericValue');
        expect(opts.maxNumericValue).toBeLessThanOrEqual(0.1);
      });
    });

    // Warn-level assertions presence
    describe('advisory metric assertions (warn or error)', () => {
      for (const key of REQUIRED_PRESENT_ASSERTIONS) {
        it(`${key} assertion is defined`, () => {
          expect(assertions).toHaveProperty(key);
        });

        it(`${key} severity is either warn or error`, () => {
          const [severity] = assertions[key];
          expect(['warn', 'error']).toContain(severity);
        });
      }
    });

    // Ensure every assertion entry is a [severity, options] tuple
    describe('assertion format validation', () => {
      it('every assertion is a two-element array', () => {
        for (const [key, value] of Object.entries(assertions)) {
          expect(Array.isArray(value)).toBe(true);
          expect(value).toHaveLength(2);
          expect(typeof value[0]).toBe('string');
          expect(typeof value[1]).toBe('object');
          // Provide a useful failure message
          if (!Array.isArray(value) || value.length !== 2) {
            throw new Error(`Assertion "${key}" is malformed: ${JSON.stringify(value)}`);
          }
        }
      });

      it('every severity is one of: error, warn, off', () => {
        const valid = new Set(['error', 'warn', 'off']);
        for (const [key, [severity]] of Object.entries(assertions)) {
          expect(valid.has(severity)).toBe(true);
          if (!valid.has(severity)) {
            throw new Error(`"${key}" has unknown severity "${severity}"`);
          }
        }
      });

      it('category score assertions use minScore, not maxNumericValue', () => {
        const categoryKeys = Object.keys(assertions).filter((k) =>
          k.startsWith('categories:')
        );
        for (const key of categoryKeys) {
          const [, opts] = assertions[key];
          expect(opts).toHaveProperty('minScore');
          expect(opts).not.toHaveProperty('maxNumericValue');
        }
      });

      it('timing metric assertions use maxNumericValue, not minScore', () => {
        const timingKeys = [
          'first-contentful-paint',
          'largest-contentful-paint',
          'total-blocking-time',
          'interactive',
          'speed-index',
        ].filter((k) => Object.prototype.hasOwnProperty.call(assertions, k));

        for (const key of timingKeys) {
          const [, opts] = assertions[key];
          expect(opts).toHaveProperty('maxNumericValue');
        }
      });
    });

    // Sanity-check: thresholds are not set so tight they always fail
    describe('threshold sanity bounds', () => {
      it('performance minScore is between 0 and 1', () => {
        const [, opts] = assertions['categories:performance'];
        expect(opts.minScore).toBeGreaterThan(0);
        expect(opts.minScore).toBeLessThanOrEqual(1);
      });

      it('accessibility minScore is between 0 and 1', () => {
        const [, opts] = assertions['categories:accessibility'];
        expect(opts.minScore).toBeGreaterThan(0);
        expect(opts.minScore).toBeLessThanOrEqual(1);
      });

      it('LCP maxNumericValue is a realistic millisecond value (>0, ≤10000)', () => {
        const [, opts] = assertions['largest-contentful-paint'];
        expect(opts.maxNumericValue).toBeGreaterThan(0);
        expect(opts.maxNumericValue).toBeLessThanOrEqual(10000);
      });

      it('CLS maxNumericValue is a realistic score (>0, ≤1)', () => {
        const [, opts] = assertions['cumulative-layout-shift'];
        expect(opts.maxNumericValue).toBeGreaterThan(0);
        expect(opts.maxNumericValue).toBeLessThanOrEqual(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // upload section
  // -------------------------------------------------------------------------

  describe('ci.upload', () => {
    let upload;

    beforeAll(() => {
      upload = config.ci.upload;
    });

    it('defines a target', () => {
      expect(typeof upload.target).toBe('string');
      expect(upload.target.trim()).not.toBe('');
    });

    it('uses filesystem target (no external service required)', () => {
      expect(upload.target).toBe('filesystem');
    });

    it('defines an outputDir', () => {
      expect(typeof upload.outputDir).toBe('string');
      expect(upload.outputDir.trim()).not.toBe('');
    });

    it('outputDir is .lighthouseci (matches CI artifact upload path)', () => {
      expect(upload.outputDir).toBe('.lighthouseci');
    });
  });

  // -------------------------------------------------------------------------
  // Config file integrity
  // -------------------------------------------------------------------------

  describe('config file integrity', () => {
    it('file exists at repo root', () => {
      const configPath = path.resolve(__dirname, '../../.lighthouserc.json');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('parses as valid JSON without errors', () => {
      const configPath = path.resolve(__dirname, '../../.lighthouserc.json');
      const raw = fs.readFileSync(configPath, 'utf8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('does not contain any TODO or FIXME placeholders', () => {
      const configPath = path.resolve(__dirname, '../../.lighthouserc.json');
      const raw = fs.readFileSync(configPath, 'utf8');
      expect(raw).not.toMatch(/TODO|FIXME/i);
    });

    it('contains no duplicate URL entries', () => {
      const urls = config.ci.collect.url;
      const unique = new Set(urls);
      expect(unique.size).toBe(urls.length);
    });
  });
});
