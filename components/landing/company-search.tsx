'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { CompanyHit } from '@/lib/mocks/companies';

// 500ms instead of PRD's 350ms because Apiverket's per-minute rate limit
// is sharper than the daily quota suggests; longer debounce means a typed
// search like "Care of Sweden" fires one request when the user stops
// typing rather than five along the way.
const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'rate-limited' | 'error';

export function CompanySearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CompanyHit[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  useEffect(() => {
    if (!debounced) {
      setHits([]);
      setStatus('idle');
      return;
    }
    // Don't slam Apiverket on 1–2 char prefixes; usually noise while the
    // user is mid-typing. The orgnr shortcut still works for full numbers
    // because those are 10 digits.
    const digitsOnly = debounced.replace(/\D/g, '');
    const isOrgnr = /^\d{10}$/.test(digitsOnly);
    if (!isOrgnr && debounced.length < MIN_QUERY_LENGTH) {
      setHits([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);
    async function run() {
      try {
        const res = await fetch(`/api/company/search?q=${encodeURIComponent(debounced)}`);
        if (cancelled) return;
        if (res.status === 429) {
          // Two distinct 429s share this status: our per-minute middleware
          // limit and Apiverket's per-day quota. Read the server-side
          // message so the user sees the right one ("vänta en stund" vs
          // "dagsgränsen nådd") instead of a generic guess.
          const body = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          setErrorMessage(
            body?.error?.message ?? 'För många uppslag — vänta en stund och försök igen.',
          );
          setStatus('rate-limited');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { data: CompanyHit[] | null };
        if (cancelled) return;
        const next = json.data ?? [];
        setHits(next);
        setStatus(next.length === 0 ? 'empty' : 'ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const onSelect = (orgnr: string) => {
    router.push(`/assess/confirm?orgnr=${orgnr}`);
  };

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor="company-search" className="sr-only">
        Sök företag
      </label>
      <input
        id="company-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sök på företagsnamn eller organisationsnummer"
        autoComplete="off"
        className="block w-full rounded-lg border border-border bg-white px-5 py-4 text-[16px] text-ink placeholder:text-muted focus:border-mid focus:outline-none focus:ring-2 focus:ring-lime-soft"
      />

      {status === 'idle' ? null : (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-[0_4px_24px_rgba(25,43,45,0.08)]">
          {status === 'loading' ? <Row text="Söker…" /> : null}
          {status === 'empty' ? (
            <Row text={`Ingen träff för "${debounced}". Prova organisationsnummer eller starta en manuell bedömning.`} />
          ) : null}
          {status === 'rate-limited' ? (
            <Row text={errorMessage ?? 'För många uppslag — vänta en stund och försök igen.'} />
          ) : null}
          {status === 'error' ? (
            <Row text="Kunde inte söka just nu. Försök igen om en stund." />
          ) : null}
          {status === 'ready'
            ? hits.map((hit) => (
                <button
                  key={hit.orgnr}
                  type="button"
                  onClick={() => onSelect(hit.orgnr)}
                  className="flex w-full items-baseline justify-between gap-4 px-5 py-3 text-left transition-colors duration-200 ease-out hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                >
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium text-ink">{hit.name}</span>
                    <span className="text-[13px] text-mid">{hit.city}</span>
                  </span>
                  <span className="font-mono text-[12px] text-mid">{hit.orgnr}</span>
                </button>
              ))
            : null}
        </div>
      )}
    </div>
  );
}

function Row({ text }: { text: string }) {
  return <p className="px-5 py-4 text-[14px] text-mid">{text}</p>;
}
