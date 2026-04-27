type Props = {
  current: 1 | 2 | 3;
  steps: { id: 1 | 2 | 3; label: string }[];
};

export function StepProgress({ current, steps }: Props) {
  return (
    <ol className="flex w-full items-center gap-3" aria-label="Stegindikator">
      {steps.map((step, idx) => {
        const isActive = step.id === current;
        const isDone = step.id < current;
        const isLast = idx === steps.length - 1;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full font-mono text-[12px] transition-colors duration-200 ease-out ${
                  isActive
                    ? 'bg-lime text-deep'
                    : isDone
                      ? 'bg-deep text-surface'
                      : 'border border-border bg-white text-mid'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {step.id}
              </span>
              <span
                className={`text-[13px] font-medium ${isActive ? 'text-ink' : isDone ? 'text-mid' : 'text-muted'}`}
              >
                {step.label}
              </span>
            </div>
            {isLast ? null : (
              <span
                className={`h-px flex-1 ${isDone ? 'bg-deep' : 'bg-border'}`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
