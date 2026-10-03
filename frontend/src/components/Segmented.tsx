interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Segmented control (Figma: Month | Patterns switch). */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-line bg-paper p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-[44px] rounded-full px-5 text-[13px] font-semibold transition-colors ${
            option.value === value ? 'bg-forest text-onforest' : 'text-muted hover:text-forest'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
