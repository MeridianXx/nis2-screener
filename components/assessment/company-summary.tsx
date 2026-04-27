import type { CompanyProfile } from '@/lib/mocks/companies';
import { SECTOR_LOOKUP } from '@/lib/sectors';

type Props = {
  profile: CompanyProfile;
  sectorKey: string | null;
};

export function CompanySummary({ profile, sectorKey }: Props) {
  const sectorLabel = sectorKey
    ? SECTOR_LOOKUP[sectorKey]?.label ?? 'Ingen NIS2-sektor'
    : 'Ingen NIS2-sektor identifierad';

  const facts: { label: string; value: string }[] = [
    { label: 'Organisationsnummer', value: profile.orgnr },
    { label: 'Säte', value: profile.city || '—' },
    {
      label: 'SNI-kod',
      value: `${profile.sniCode || '—'}${profile.sniLabel ? ` · ${profile.sniLabel}` : ''}`,
    },
    { label: 'Bedömd sektor', value: sectorLabel },
  ];

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mid">
          Hämtat från företagsregistret
        </p>
        <h2 className="text-[24px] leading-tight text-ink">{profile.name}</h2>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-mid">
              {f.label}
            </dt>
            <dd className="text-[15px] text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
