export function ShieldMark({ size = 56 }: { size?: number }) {
  const stroke = 1.5;
  return (
    <span
      className="inline-flex flex-col items-center"
      aria-hidden
      style={{ width: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-deep"
      >
        <path d="M12 2.5 4 5v6.5c0 4.6 3.2 8.5 8 10 4.8-1.5 8-5.4 8-10V5l-8-2.5Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span className="mt-1 block h-[3px] w-7 rounded-full bg-lime" />
    </span>
  );
}
