import { useId } from 'react';
import type { ReactNode } from 'react';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  id?: string;
};

export function Checkbox({ checked, onChange, label, description, id }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label
      htmlFor={inputId}
      className={`group flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-4 transition-colors duration-200 ease-out ${checked ? 'border-deep' : 'border-border hover:border-mid'}`}
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded border transition-colors duration-200 ease-out ${checked ? 'border-deep bg-lime' : 'border-border bg-white'}`}
        aria-hidden
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-deep" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 8 3.5 3.5L13 5" />
          </svg>
        ) : null}
      </span>
      <input
        id={inputId}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-medium text-ink">{label}</span>
        {description ? <span className="text-[13px] text-mid">{description}</span> : null}
      </span>
    </label>
  );
}
