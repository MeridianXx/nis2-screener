import type { Verdict } from '@/lib/assess';
import { VERDICT_STYLES } from '@/lib/verdict-styles';

type Props = { verdict: Verdict };

export function VerdictHero({ verdict }: Props) {
  const style = VERDICT_STYLES[verdict.code];
  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border ${style.heroBg} ${style.heroText} ${style.heroBorder} px-8 py-10`}
    >
      <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${style.eyebrowAccent}`}>
        {style.eyebrow}
      </p>
      <h1 className="text-[36px] leading-tight tracking-[-0.01em] sm:text-[44px]">
        {verdict.title}
      </h1>
      <p className="max-w-2xl text-[16px] leading-relaxed opacity-90">{verdict.summary}</p>
    </section>
  );
}
