import { isClipboardWriteAvailable, writeToClipboard } from '../clipboard';

function setSecureContext(value: boolean) {
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value,
  });
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value,
  });
}

describe('clipboard', () => {
  const originalSecureContext = window.isSecureContext;
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    setSecureContext(originalSecureContext);
    setClipboard(originalClipboard);
  });

  describe('isClipboardWriteAvailable', () => {
    it('is true in a secure context with a writeText function', () => {
      setSecureContext(true);
      setClipboard({ writeText: jest.fn() });
      expect(isClipboardWriteAvailable()).toBe(true);
    });

    it('is false when the context is not secure', () => {
      setSecureContext(false);
      setClipboard({ writeText: jest.fn() });
      expect(isClipboardWriteAvailable()).toBe(false);
    });

    it('is false when navigator.clipboard is missing', () => {
      setSecureContext(true);
      setClipboard(undefined);
      expect(isClipboardWriteAvailable()).toBe(false);
    });

    it('is false when writeText is not a function', () => {
      setSecureContext(true);
      setClipboard({});
      expect(isClipboardWriteAvailable()).toBe(false);
    });
  });

  describe('writeToClipboard', () => {
    it('resolves ok:true and forwards the text on success', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      setSecureContext(true);
      setClipboard({ writeText });

      await expect(writeToClipboard('secret-value')).resolves.toEqual({
        ok: true,
      });
      expect(writeText).toHaveBeenCalledWith('secret-value');
    });

    it('resolves ok:false reason:unsupported without calling writeText in an insecure context', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      setSecureContext(false);
      setClipboard({ writeText });

      await expect(writeToClipboard('secret-value')).resolves.toEqual({
        ok: false,
        reason: 'unsupported',
      });
      expect(writeText).not.toHaveBeenCalled();
    });

    it('resolves ok:false reason:unsupported when the Clipboard API is absent', async () => {
      setSecureContext(true);
      setClipboard(undefined);

      await expect(writeToClipboard('secret-value')).resolves.toEqual({
        ok: false,
        reason: 'unsupported',
      });
    });

    it('resolves ok:false reason:denied instead of throwing when the write is rejected', async () => {
      const writeText = jest
        .fn()
        .mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
      setSecureContext(true);
      setClipboard({ writeText });

      await expect(writeToClipboard('secret-value')).resolves.toEqual({
        ok: false,
        reason: 'denied',
      });
    });

    it('never rejects, even when writeText throws synchronously', async () => {
      const writeText = jest.fn(() => {
        throw new Error('boom');
      });
      setSecureContext(true);
      setClipboard({ writeText });

      await expect(writeToClipboard('secret-value')).resolves.toEqual({
        ok: false,
        reason: 'denied',
      });
    });
  });
});
