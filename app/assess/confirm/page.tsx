import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { fetchCompanyProfile, CompanyNotFoundError } from '@/lib/company';
import { lookupSNI } from '@/lib/sni-mapping';
import { CompanySummary } from '@/components/assessment/company-summary';
import { ConfirmFlow } from '@/components/assessment/confirm-flow';
import { DisambiguationForm } from '@/components/assessment/disambiguation-form';
import { NONE_SECTOR } from '@/lib/assess-form';

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string | null {
  const value = params[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0] !== undefined) return value[0];
  return null;
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const orgnr = readParam(searchParams, 'orgnr');
  if (!orgnr || !/^\d{10}$/.test(orgnr)) redirect('/');

  let profile;
  try {
    profile = await fetchCompanyProfile(orgnr);
  } catch (err) {
    if (err instanceof CompanyNotFoundError) notFound();
    throw err;
  }

  const sniMatch = lookupSNI(profile.sniCode);
  const overrideSector = readParam(searchParams, 'sector');

  // Resolve the sector that should be passed to the rule engine. Priority:
  // 1) explicit override from disambiguation choice (?sector=...)
  // 2) unambiguous SNI mapping
  // 3) ambiguous → render the disambiguation form and stop.
  const resolvedSectorKey =
    overrideSector ?? (sniMatch?.disambiguation ? null : sniMatch?.sector ?? null);

  const showDisambiguation = sniMatch?.disambiguation && !overrideSector;

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

      {showDisambiguation && sniMatch?.disambiguation ? (
        <div className="flex flex-col gap-8">
          <CompanySummary profile={profile} sectorKey={null} />
          <DisambiguationForm orgnr={profile.orgnr} disambiguation={sniMatch.disambiguation} />
        </div>
      ) : (
        <ConfirmFlow
          profile={profile}
          sectorKey={resolvedSectorKey === NONE_SECTOR ? null : resolvedSectorKey}
        />
      )}
    </main>
  );
}
