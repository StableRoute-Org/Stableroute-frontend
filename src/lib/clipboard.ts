export type ClipboardWriteFailureReason = 'unsupported' | 'denied';

export type ClipboardWriteResult =
  { ok: true } | { ok: false; reason: ClipboardWriteFailureReason };

function getClipboard(): Pick<Clipboard, 'writeText'> | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.clipboard;
}

/**
 * True when the async Clipboard API can be used: a secure context (HTTPS or
 * localhost) with `navigator.clipboard.writeText` present. Browsers throw
 * synchronously or return a rejected promise outside a secure context, so
 * this must be checked before calling `writeToClipboard`.
 */
export function isClipboardWriteAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    typeof getClipboard()?.writeText === 'function'
  );
}

/**
 * Writes text to the clipboard without ever throwing or rejecting. Callers
 * get a result object instead, so insecure-context, missing-API, and
 * permission-denied failures can all be handled the same way (e.g. a toast
 * plus a selectable fallback field) instead of risking an unhandled
 * rejection.
 */
export async function writeToClipboard(
  text: string
): Promise<ClipboardWriteResult> {
  if (!isClipboardWriteAvailable()) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    await getClipboard()!.writeText(text);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'denied' };
  }
}
