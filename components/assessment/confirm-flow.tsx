'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CompanyProfile } from '@/lib/mocks/companies';
import { Button } from '@/components/ui/button';
import { CompanySummary } from '@/components/assessment/company-summary';
import { StepSize } from '@/components/assessment/step-size';
import { StepSpecials } from '@/components/assessment/step-specials';
import {
  encodeFormToParams,
  isStepComplete,
  NONE_SECTOR,
  type FormState,
} from '@/lib/assess-form';

type Props = {
  profile: CompanyProfile;
  sectorKey: string | null;
};

export function ConfirmFlow({ profile, sectorKey }: Props) {
  const router = useRouter();

  const initialFromProfile = (): FormState => ({
    sectorKey: sectorKey ?? NONE_SECTOR,
    employees: profile.employees != null ? String(profile.employees) : '',
    turnover: profile.turnover != null ? String(profile.turnover) : '',
    balance: profile.balance != null ? String(profile.balance) : '',
    specials: [],
  });

  const [form, setForm] = useState<FormState>(initialFromProfile);

  const onSubmit = () => {
    const params = encodeFormToParams(form, profile.orgnr);
    router.push(`/assess/result?${params.toString()}`);
  };

  const sizeReady = isStepComplete(form, 2);

  return (
    <div className="flex flex-col gap-8">
      <CompanySummary profile={profile} sectorKey={sectorKey} />

      {/* Apiverket returns no employees/turnover/balance — the user must
          fill these in. Pre-fill from cached data when present (e.g. mock
          dataset) so we don't lose information that's already known. */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <StepSize
          employees={form.employees}
          turnover={form.turnover}
          balance={form.balance}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <StepSpecials
          values={form.specials}
          onChange={(specials) => setForm((f) => ({ ...f, specials }))}
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-mid">
          Stämmer inte uppgifterna? Starta om via{' '}
          <Link
            href="/assess"
            className="underline decoration-border underline-offset-2 hover:decoration-ink"
          >
            manuell bedömning
          </Link>
          .
        </p>
        <Button onClick={onSubmit} disabled={!sizeReady}>
          Hämta bedömning
        </Button>
      </div>
    </div>
  );
}
