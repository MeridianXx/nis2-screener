'use client';

import { useEffect, useState } from 'react';
import type { Verdict } from '@/lib/assess';

type Props = { verdict: Verdict };

type Status = 'loading' | 'ready' | 'fallback';

export function AiExplanation({ verdict }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            verdict: verdict.code,
            sector: verdict.sector,
            size: verdict.size,
            tillsyn: verdict.tillsyn,
            title: verdict.title,
            summary: verdict.summary,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { data: { text: string } | null };
        if (cancelled) return;
        if (json.data?.text) {
          setText(json.data.text);
          setStatus('ready');
        } else {
          setStatus('fallback');
        }
      } catch {
        if (!cancelled) setStatus('fallback');
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [verdict]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[24px] leading-tight text-ink">Vad betyder bedömningen?</h2>
      {status === 'loading' ? <Skeleton /> : null}
      {status === 'ready' && text ? <RenderedText text={text} /> : null}
      {status === 'fallback' ? (
        <p className="text-[15px] leading-relaxed text-mid">
          AI-fördjupningen är inte tillgänglig just nu. Bedömningen ovan baseras enbart
          på regelmotorn och PRD:ns klassificeringsregler. Försök igen om en stund.
        </p>
      ) : null}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <SkeletonLine width="w-11/12" />
      <SkeletonLine width="w-10/12" />
      <SkeletonLine width="w-8/12" />
      <div className="h-2" />
      <SkeletonLine width="w-11/12" />
      <SkeletonLine width="w-9/12" />
      <div className="h-2" />
      <SkeletonLine width="w-10/12" />
      <SkeletonLine width="w-7/12" />
    </div>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return <span className={`block h-3 ${width} rounded bg-subtle`} />;
}

function RenderedText({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-ink">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
