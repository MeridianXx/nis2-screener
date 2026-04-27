'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StepProgress } from '@/components/assessment/step-progress';
import { StepSector } from '@/components/assessment/step-sector';
import { StepSize } from '@/components/assessment/step-size';
import { StepSpecials } from '@/components/assessment/step-specials';
import {
  INITIAL_FORM,
  encodeFormToParams,
  isStepComplete,
  type FormState,
} from '@/lib/assess-form';

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Sektor' },
  { id: 2, label: 'Storlek' },
  { id: 3, label: 'Särskilda förhållanden' },
];

function parseStep(raw: string | null): Step {
  if (raw === '2') return 2;
  if (raw === '3') return 3;
  return 1;
}

export function AssessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseStep(searchParams.get('step'));
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // If user lands directly on ?step=2 or ?step=3 without form state, send them
  // back to step 1 so the flow stays linear.
  useEffect(() => {
    if (step > 1 && form.sectorKey === null) {
      router.replace('/assess');
    }
  }, [step, form.sectorKey, router]);

  const goTo = useCallback(
    (next: Step) => {
      const params = new URLSearchParams();
      if (next > 1) params.set('step', String(next));
      const query = params.toString();
      router.push(`/assess${query ? `?${query}` : ''}`);
    },
    [router],
  );

  const onNext = () => {
    if (step === 1) goTo(2);
    else if (step === 2) goTo(3);
  };

  const onBack = () => {
    if (step === 3) goTo(2);
    else if (step === 2) goTo(1);
  };

  const onSubmit = () => {
    const params = encodeFormToParams(form);
    router.push(`/assess/result?${params.toString()}`);
  };

  const canAdvance = isStepComplete(form, step);

  return (
    <div className="flex flex-col gap-12">
      <StepProgress current={step} steps={STEPS} />

      <div className="flex flex-col gap-8">
        {step === 1 ? (
          <StepSector
            value={form.sectorKey}
            onChange={(key) => setForm((f) => ({ ...f, sectorKey: key }))}
          />
        ) : null}
        {step === 2 ? (
          <StepSize
            employees={form.employees}
            turnover={form.turnover}
            balance={form.balance}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          />
        ) : null}
        {step === 3 ? (
          <StepSpecials
            values={form.specials}
            onChange={(specials) => setForm((f) => ({ ...f, specials }))}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button variant="ghost" onClick={onBack} disabled={step === 1}>
          Tillbaka
        </Button>
        {step < 3 ? (
          <Button onClick={onNext} disabled={!canAdvance}>
            Nästa steg
          </Button>
        ) : (
          <Button onClick={onSubmit}>Hämta bedömning</Button>
        )}
      </div>
    </div>
  );
}
