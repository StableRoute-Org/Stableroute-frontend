"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/TextField";
import { apiPost } from "@/lib/apiClient";
import { assetsDiffer } from "@/lib/quote";

const ASSET_CODE_RE = /^[A-Za-z0-9]{1,12}$/;
const ASSET_CODE_ERROR = "Use 1-12 ASCII letters or numbers.";

type FormErrors = {
  source?: string;
  destination?: string;
  form?: string;
};

/**
 * Trims and normalizes Stellar asset codes after validating the raw code
 * characters are ASCII alphanumeric only.
 */
function normalizeAssetCode(value: string): string | null {
  const trimmed = value.trim();
  return ASSET_CODE_RE.test(trimmed) ? trimmed.toUpperCase() : null;
}

export default function NewPairPage() {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedSource = normalizeAssetCode(source);
    const normalizedDestination = normalizeAssetCode(destination);
    const nextErrors: FormErrors = {};

    if (!normalizedSource) {
      nextErrors.source = ASSET_CODE_ERROR;
    }
    if (!normalizedDestination) {
      nextErrors.destination = ASSET_CODE_ERROR;
    }
    if (
      normalizedSource &&
      normalizedDestination &&
      normalizedSource === normalizedDestination
    ) {
      nextErrors.destination = "Source and destination must differ.";
    }

    if (Object.keys(nextErrors).length > 0 || !normalizedSource || !normalizedDestination) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSource(normalizedSource);
    setDestination(normalizedDestination);
    setLoading(true);
    setStatusNote("Registering pair…");
    try {
      await apiPost("/api/v1/pairs", {
        source: normalizedSource,
        destination: normalizedDestination,
      });
      setStatusNote("Pair registered. Redirecting…");
      router.push("/pairs");
    } catch (err) {
      setErrors({ form: (err as Error).message });
      setStatusNote(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">New pair</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <TextField
          id="source"
          label="Source"
          required
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setErrors((current) => ({
              ...current,
              source: undefined,
              destination:
                current.destination === "Source and destination must differ."
                  ? undefined
                  : current.destination,
              form: undefined,
            }));
          }}
          error={errors.source}
          aria-invalid={errors.source ? true : undefined}
        />
        <TextField
          id="destination"
          label="Destination"
          required
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            setErrors((current) => ({
              ...current,
              destination: undefined,
              form: undefined,
            }));
          }}
          error={errors.destination}
          aria-invalid={errors.destination ? true : undefined}
        />
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {loading ? "Saving…" : "Register pair"}
        </button>
        <p role="status" aria-live="polite" className="sr-only">
          {statusNote ?? ""}
        </p>
        {errors.form && (
          <p role="alert" className="text-sm text-rose-600">
            {errors.form}
          </p>
        )}
      </form>
    </main>
  );
}
