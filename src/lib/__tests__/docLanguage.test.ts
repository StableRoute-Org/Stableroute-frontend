import {
  readDocLanguage,
  writeDocLanguage,
} from '@/lib/docLanguage';

describe('docLanguage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  describe('readDocLanguage', () => {
    it('returns curl by default', () => {
      expect(readDocLanguage()).toBe('curl');
    });

    it('returns stored valid language', () => {
      window.sessionStorage.setItem('stableroute.docs.lang', 'javascript');
      expect(readDocLanguage()).toBe('javascript');
    });

    it('returns curl for stored curl', () => {
      window.sessionStorage.setItem('stableroute.docs.lang', 'curl');
      expect(readDocLanguage()).toBe('curl');
    });

    it('falls back to curl for invalid stored value', () => {
      window.sessionStorage.setItem('stableroute.docs.lang', 'python');
      expect(readDocLanguage()).toBe('curl');
    });

    it('falls back to curl for empty string', () => {
      window.sessionStorage.setItem('stableroute.docs.lang', '');
      expect(readDocLanguage()).toBe('curl');
    });

    it('falls back to curl when storage throws', () => {
      const originalGetItem = window.sessionStorage.getItem;
      window.sessionStorage.getItem = jest.fn(() => {
        throw new Error('private mode');
      });
      expect(readDocLanguage()).toBe('curl');
      window.sessionStorage.getItem = originalGetItem;
    });

    it('returns curl on the server', () => {
      const originalWindow = global.window;
      // @ts-expect-error testing SSR
      delete global.window;
      expect(readDocLanguage()).toBe('curl');
      global.window = originalWindow;
    });
  });

  describe('writeDocLanguage', () => {
    it('persists language to sessionStorage', () => {
      writeDocLanguage('javascript');
      expect(window.sessionStorage.getItem('stableroute.docs.lang')).toBe(
        'javascript'
      );
    });

    it('persists curl to sessionStorage', () => {
      writeDocLanguage('curl');
      expect(window.sessionStorage.getItem('stableroute.docs.lang')).toBe(
        'curl'
      );
    });

    it('overwrites previous value', () => {
      writeDocLanguage('javascript');
      writeDocLanguage('curl');
      expect(window.sessionStorage.getItem('stableroute.docs.lang')).toBe(
        'curl'
      );
    });

    it('does not throw when storage throws', () => {
      const originalSetItem = window.sessionStorage.setItem;
      window.sessionStorage.setItem = jest.fn(() => {
        throw new Error('quota exceeded');
      });
      expect(() => writeDocLanguage('javascript')).not.toThrow();
      window.sessionStorage.setItem = originalSetItem;
    });

    it('does nothing on the server', () => {
      const originalWindow = global.window;
      // @ts-expect-error testing SSR
      delete global.window;
      expect(() => writeDocLanguage('javascript')).not.toThrow();
      global.window = originalWindow;
    });
  });
});
