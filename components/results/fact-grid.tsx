import { SECTOR_LOOKUP } from '@/lib/sectors';
import type { Verdict } from '@/lib/assess';

type Props = { verdict: Verdict };

export function FactGrid({ verdict }: Props) {
  const sectorLabel = verdict.sector
    ? SECTOR_LOOKUP[verdict.sector]?.label ?? verdict.sector
    : 'Ingen NIS2-sektor identifierad';

  const facts = [
    { label: 'Sektor', value: sectorLabel },
    { label: 'Storlek', value: verdict.size },
    { label: 'Tillsynsmyndighet', value: verdict.tillsyn ?? '—' },
  ];

  return (
    <dl className="grid gap-4 rounded-xl border border-border bg-white p-6 sm:grid-cols-3">
      {facts.map((f) => (
        <div key={f.label} className="flex flex-col gap-1">
          <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-mid">
            {f.label}
          </dt>
          <dd className="text-[15px] text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
