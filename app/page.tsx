import Link from 'next/link';
import { ShieldMark } from '@/components/ui/shield-mark';
import { CompanySearch } from '@/components/landing/company-search';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <ShieldMark />
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mid">
          Tech Stn · NIS2-kollen
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <h1 className="text-[44px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
          Omfattas ert företag av cybersäkerhetslagen?
        </h1>
        <p className="mx-auto max-w-xl text-[18px] leading-relaxed text-mid">
          Få en preliminär bedömning på under två minuter. Verktyget mappar er sektor
          mot bilaga 1 och 2, kontrollerar storlekströsklarna i EU:s SMF-definition och
          flaggar specialfall som CER-status och offentlig verksamhet.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <CompanySearch />
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-mid">eller</p>
        <Link
          href="/assess"
          className="rounded-lg bg-deep px-6 py-3 text-[15px] font-medium text-surface transition-colors duration-200 ease-out hover:bg-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          Starta manuell bedömning
        </Link>
      </div>

      <p className="max-w-md text-[13px] leading-relaxed text-mid">
        Verktyget ger preliminära bedömningar, inte juridisk rådgivning. Företag
        ansvarar själva för att bedöma omfattning och anmäla sig till Myndigheten för
        civilt försvar enligt MCFFS 2026:1.
      </p>
    </main>
  );
}
