/** Small uppercase section kicker (Figma eyebrow). */
export function Eyebrow({ children, className = '' }: { children: string; className?: string }) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[1.5px] text-forest ${className}`.trim()}
    >
      {children}
    </p>
  );
}

interface SerifNumberProps {
  value: string | number;
  label?: string;
  className?: string;
}

/** Large serif figure used as a graphic element (Figma editorial style). */
export function SerifNumber({ value, label, className = '' }: SerifNumberProps) {
  return (
    <span className={`inline-flex flex-col ${className}`.trim()}>
      <span className="font-serif text-[clamp(38px,4vw,53px)] font-semibold leading-[1.06] tracking-[-1.2px] tabular-nums">
        {value}
      </span>
      {label ? <span className="mt-1 text-xs text-muted">{label}</span> : null}
    </span>
  );
}
