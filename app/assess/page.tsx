import { Suspense } from 'react';
import Link from 'next/link';
import { AssessForm } from '@/components/assessment/assess-form';

export default function AssessPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-mid hover:text-ink"
        >
          ← Tech Stn · NIS2-kollen
        </Link>
      </div>

      <Suspense fallback={<p className="text-mid">Laddar formulär…</p>}>
        <AssessForm />
      </Suspense>
    </main>
  );
}
