import type { ReactNode } from 'react';

interface PillProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

/** Selectable rounded pill (≥44px touch target). */
export function Pill({ selected = false, onClick, children, className = '' }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={onClick ? selected : undefined}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
        selected
          ? 'border-forest bg-sage font-bold text-forest-deep'
          : 'border-line bg-paper text-muted hover:border-forest hover:text-forest'
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
}

interface TagSelectorProps<T extends string> {
  options: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
  getLabel?: (value: T) => string;
  legend: string;
}

/** Multi-select pill group with a real fieldset legend (a11y). */
export function TagSelector<T extends string>({
  options,
  selected,
  onChange,
  getLabel,
  legend,
}: TagSelectorProps<T>) {
  const toggle = (value: T) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Pill key={option} selected={selected.includes(option)} onClick={() => toggle(option)}>
            {getLabel ? getLabel(option) : option}
          </Pill>
        ))}
      </div>
    </fieldset>
  );
}
