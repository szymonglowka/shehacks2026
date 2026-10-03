/** Brand logo: four petals (from Figma Make App.tsx) + wordmark. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 17.8C6 15.2 7 4.9 11.3 4.1c4.5-.9 6.4 5.7 6.7 13.7Z" />
      <path d="M18 17.8C30 15.2 29 4.9 24.7 4.1c-4.5-.9-6.4 5.7-6.7 13.7Z" />
      <path d="M18 18.2C6 20.8 7 31.1 11.3 31.9c4.5.9 6.4-5.7 6.7-13.7Z" />
      <path d="M18 18.2c12 2.6 11 12.9 6.7 13.7-4.5.9-6.4-5.7-6.7-13.7Z" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 text-forest">
      <BrandMark size={compact ? 26 : 32} />
      <span className="-tracking-[0.6px] font-serif text-[30px] font-semibold leading-none">
        otula
      </span>
    </span>
  );
}
