import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  suffix?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, suffix, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-mono text-[11px] uppercase tracking-[0.15em] text-mid"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-lg border border-border bg-white px-4 py-3 text-[15px] text-ink placeholder:text-muted focus:border-mid focus:outline-none focus:ring-2 focus:ring-lime-soft ${suffix ? 'pr-14' : ''} ${className}`}
          {...rest}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[12px] text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-[13px] text-mid">{hint}</p> : null}
    </div>
  );
});
