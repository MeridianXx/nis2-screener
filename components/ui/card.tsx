import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-xl border border-border bg-white p-6 ${className}`}
      {...rest}
    />
  );
}
