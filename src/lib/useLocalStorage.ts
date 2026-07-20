"use client";

import { useCallback, useEffect, useState } from "react";

type Validate<T> = (value: unknown) => value is T;

export type Serializer<T> = {
  read: (raw: string) => unknown;
  write: (value: T) => string;
};

/** Default serializer for structured values (objects, arrays, etc). */
const jsonSerializer: Serializer<unknown> = {
  read: (raw) => JSON.parse(raw),
  write: (value) => JSON.stringify(value),
};

/**
 * Serializer for plain string values that must round-trip byte-for-byte,
 * e.g. because a pre-hydration script outside React reads the same key with
 * a raw string comparison and can't be changed to expect JSON quoting.
 */
export const rawStringSerializer: Serializer<string> = {
  read: (raw) => raw,
  write: (value) => value,
};

/**
 * Read and deserialize a localStorage value. Falls back to `defaultValue`
 * when running on the server, when the key is absent, when deserializing
 * throws (e.g. malformed JSON), when storage access itself throws (privacy
 * modes commonly do this), or when `validate` rejects the deserialized
 * shape.
 */
export function readLocalStorageValue<T>(
  key: string,
  defaultValue: T,
  validate?: Validate<T>,
  serializer: Serializer<T> = jsonSerializer as Serializer<T>,
): T {
  if (typeof window === "undefined") return defaultValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed = serializer.read(raw);
    if (validate && !validate(parsed)) return defaultValue;
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Serialize and write a localStorage value. Best-effort: returns false
 * instead of throwing when running on the server, when storage is disabled,
 * or when the write fails (e.g. a quota-exceeded DOMException). Callers
 * should treat persistence as a nice-to-have, not a guarantee.
 */
export function writeLocalStorageValue<T>(
  key: string,
  value: T,
  serializer: Serializer<T> = jsonSerializer as Serializer<T>,
): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, serializer.write(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * A localStorage-backed piece of React state, keyed by `key`.
 *
 * - SSR-safe: renders `defaultValue` on the server and on first client
 *   render (avoiding a hydration mismatch), then syncs from storage in an
 *   effect once mounted.
 * - Corrupted or unexpected stored data falls back to `defaultValue` rather
 *   than throwing; pass `validate` to narrow/reject deserialized values that
 *   don't match the expected shape.
 * - Writes are best-effort: a quota-exceeded or disabled-storage error is
 *   swallowed, and the in-memory state still updates so the UI keeps
 *   working even though the value won't persist across a reload.
 * - Defaults to JSON serialization; pass `rawStringSerializer` for a plain
 *   string value that must stay byte-for-byte compatible with a
 *   non-JSON reader (e.g. a pre-hydration script).
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validate?: Validate<T>,
  serializer: Serializer<T> = jsonSerializer as Serializer<T>,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    setValue(readLocalStorageValue(key, defaultValue, validate, serializer));
    // Only re-sync when the key changes; re-reading on every defaultValue/
    // validate/serializer identity change would fight a caller passing
    // inline values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        writeLocalStorageValue(key, resolved, serializer);
        return resolved;
      });
    },
    [key, serializer],
  );

  return [value, set];
}
