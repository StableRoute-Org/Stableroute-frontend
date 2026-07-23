'use client';

import { useCallback, useEffect, useState } from 'react';
import { writeToClipboard } from '@/lib/clipboard';
import { useToast } from '@/components/ToastProvider';
import { readDocLanguage, writeDocLanguage } from '@/lib/docLanguage';

export type Language = 'curl' | 'javascript';

export const LANGUAGE_LABELS: Record<Language, string> = {
  curl: 'cURL',
  javascript: 'JavaScript',
};

export type CodeSampleProps = {
  samples: Record<Language, string>;
  /** Endpoint label shown in the accessible name of the copy button. */
  endpoint: string;
};

export function CodeSample({ samples, endpoint }: CodeSampleProps) {
  const { push } = useToast();
  const [lang, setLang] = useState<Language>(readDocLanguage);
  const [copying, setCopying] = useState(false);

  const languages = Object.keys(samples) as Language[];
  const singleLanguage = languages.length === 1;
  const activeLang = singleLanguage ? languages[0] : lang;

  useEffect(() => {
    if (!singleLanguage) writeDocLanguage(lang);
  }, [lang, singleLanguage]);

  const handleCopy = useCallback(async () => {
    setCopying(true);
    try {
      const result = await writeToClipboard(samples[activeLang]);
      if (result.ok) {
        push(`Copied ${LANGUAGE_LABELS[activeLang]} snippet.`);
      } else {
        push('Could not copy to clipboard.', 'error');
      }
    } finally {
      setCopying(false);
    }
  }, [samples, activeLang, push]);

  return (
    <div className="mt-2 rounded-md border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
        {!singleLanguage && (
          <div role="radiogroup" aria-label="Language" className="flex gap-1">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={activeLang === l}
                onClick={() => setLang(l)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  activeLang === l
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
              >
                {LANGUAGE_LABELS[l]}
              </button>
            ))}
          </div>
        )}
        {singleLanguage && (
          <span className="text-xs font-medium text-neutral-500">
            {LANGUAGE_LABELS[languages[0]]}
          </span>
        )}
        <button
          type="button"
          aria-label={`Copy ${LANGUAGE_LABELS[activeLang]} code for ${endpoint}`}
          disabled={copying}
          onClick={() => void handleCopy()}
          className="rounded px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code>{samples[activeLang]}</code>
      </pre>
    </div>
  );
}
