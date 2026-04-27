import Link from 'next/link';
import type { CompanyProfile } from '@/lib/mocks/companies';
import { SECTOR_LOOKUP } from '@/lib/sectors';
import { Button } from '@/components/ui/button';

type Props = {
  profile: CompanyProfile;
  sectorKey: string | null;
  resultHref: string;
};

const numberFormat = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 });

function formatMsek(value: number | null): string {
  if (value === null) return '—';
  return `${numberFormat.format(Math.round(value))} MSEK`;
}

function formatEmployees(value: number | null): string {
  if (value === null) return '—';
  return numberFormat.format(value);
}

export function CompanySummary({ profile, sectorKey, resultHref }: Props) {
  const sectorLabel = sectorKey
    ? SECTOR_LOOKUP[sectorKey]?.label ?? 'Ingen NIS2-sektor'
    : 'Ingen NIS2-sektor identifierad';

  const facts: { label: string; value: string }[] = [
    { label: 'Organisationsnummer', value: profile.orgnr },
    { label: 'Säte', value: profile.city || '—' },
    { label: 'SNI-kod', value: `${profile.sniCode}${profile.sniLabel ? ` · ${profile.sniLabel}` : ''}` },
    { label: 'Antal anställda', value: formatEmployees(profile.employees) },
    { label: 'Nettoomsättning', value: formatMsek(profile.turnover) },
    { label: 'Balansomslutning', value: formatMsek(profile.balance) },
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

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-mid">
          Stämmer uppgifterna inte? Korrigera dem manuellt i nästa steg eller starta om
          via <Link href="/assess" className="underline decoration-border underline-offset-2 hover:decoration-ink">manuell bedömning</Link>.
        </p>
        <Link href={resultHref}>
          <Button>Hämta bedömning</Button>
        </Link>
      </div>
    </section>
  );
}
