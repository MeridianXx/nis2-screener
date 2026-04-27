import Link from 'next/link';
import { redirect } from 'next/navigation';
import { assess, classifySize } from '@/lib/assess';
import { decodeFormFromParams, toAssessInput } from '@/lib/assess-form';
import { Button } from '@/components/ui/button';
import { VerdictHero } from '@/components/results/verdict-hero';
import { FactGrid } from '@/components/results/fact-grid';
import { AiExplanation } from '@/components/results/ai-explanation';
import { logAssessment } from '@/lib/cache';

type SearchParams = Record<string, string | string[] | undefined>;

function flatten(params: SearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') out.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) out.set(key, value[0]);
  }
  return out;
}

export default async function ResultPage({ searchParams }: { searchParams: SearchParams }) {
  const flat = flatten(searchParams);
  const form = decodeFormFromParams(flat);
  if (!form.sectorKey) redirect('/assess');

  const input = toAssessInput(form);
  const verdict = assess(input);

  // Fire-and-forget; failures are logged inside the helper and never block the
  // result render. Only orgnr is persisted (no PII), per CLAUDE.md.
  await logAssessment({
    orgnr: flat.get('orgnr'),
    verdict: verdict.code,
    sector: verdict.sector,
    sizeClass: classifySize(input),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-mid hover:text-ink"
        >
          ← Tech Stn · NIS2 Screener
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <VerdictHero verdict={verdict} />
        <FactGrid verdict={verdict} />
        <AiExplanation verdict={verdict} />
        <ResourceList />

        <div className="flex flex-col items-start gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-mid">
            Verktyget ger preliminära bedömningar — företag ansvarar själva för anmälan
            enligt MCFFS 2026:1.
          </p>
          <Link href="/assess">
            <Button variant="secondary">Gör en ny bedömning</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

function ResourceList() {
  const links = [
    {
      href: 'https://www.msb.se/cybersakerhetslagen',
      label: 'MCF — Cybersäkerhetslagens vägledning',
    },
    {
      href: 'https://www.regeringen.se/rattsliga-dokument/lag/2025/12/sfs-20251506/',
      label: 'SFS 2025:1506 — Cybersäkerhetslagen',
    },
    {
      href: 'https://www.msb.se/anmalan-nis2',
      label: 'Anmälningsportal (MCFFS 2026:1)',
    },
  ];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[20px] leading-tight text-ink">Officiella resurser</h2>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[15px] text-ink underline decoration-border decoration-1 underline-offset-4 hover:decoration-ink"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
