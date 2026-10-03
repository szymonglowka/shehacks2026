interface StagePillProps {
  number: string | number;
  title: string;
  subtitle?: string;
}

/** Compact stage indicator (Figma: week pill next to the welcome header). */
export function StagePill({ number, title, subtitle }: StagePillProps) {
  return (
    <div className="flex flex-none items-center gap-2.5 rounded-[18px] border border-line bg-paper py-[9px] pl-[9px] pr-[14px]">
      <span className="grid h-[42px] w-[42px] place-items-center rounded-[13px] bg-sage font-serif text-[22px] font-semibold text-forest tabular-nums">
        {number}
      </span>
      <span>
        <strong className="block text-[12px]">{title}</strong>
        {subtitle ? <small className="mt-0.5 block text-[11px] text-muted">{subtitle}</small> : null}
      </span>
    </div>
  );
}
