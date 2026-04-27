import Link from 'next/link';
import type { Disambiguation } from '@/lib/sni-mapping';
import { NONE_SECTOR } from '@/lib/assess-form';

type Props = {
  orgnr: string;
  disambiguation: Disambiguation;
};

export function DisambiguationForm({ orgnr, disambiguation }: Props) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mid">
          SNI-koden är tvetydig
        </p>
        <h2 className="text-[22px] leading-tight text-ink">{disambiguation.question}</h2>
        <p className="text-[14px] text-mid">
          Välj det alternativ som bäst beskriver er verksamhet — det styr om ni omfattas
          som digital infrastruktur, IKT-tjänsteförvaltare eller hamnar utanför.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {disambiguation.options.map((opt, idx) => {
          const sectorParam = opt.maps.sector ?? NONE_SECTOR;
          const href = `/assess/confirm?orgnr=${orgnr}&sector=${sectorParam}`;
          return (
            <Link
              key={idx}
              href={href}
              className="rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-ink transition-colors duration-200 ease-out hover:border-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
