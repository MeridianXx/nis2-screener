import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-deep text-surface hover:bg-slate disabled:bg-mid disabled:text-subtle disabled:cursor-not-allowed',
  secondary:
    'bg-white text-ink border border-border hover:border-mid disabled:text-muted disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-mid hover:text-ink disabled:text-muted disabled:cursor-not-allowed',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className = '', type = 'button', ...rest },
  ref,
) {
  const variantClass = VARIANT_CLASSES[variant];
  const base =
    'inline-flex items-center justify-center rounded-lg px-6 py-3 text-[15px] font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime';
  return (
    <button ref={ref} type={type} className={`${base} ${variantClass} ${className}`} {...rest} />
  );
});
