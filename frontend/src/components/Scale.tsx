import { Minus, Plus } from 'lucide-react';
import { Button } from './Button';

interface ScaleProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  legend: string;
  lowLabel?: string;
  highLabel?: string;
}

/** Numeric tile scale (1–5 sliders, 0–10 pain row). */
export function Scale({ min, max, value, onChange, legend, lowLabel, highLabel }: ScaleProps) {
  const options: number[] = [];
  for (let v = min; v <= max; v += 1) options.push(v);
  const compact = max - min > 5;
  return (
    <div>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const checked = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option)}
              className={`grid min-h-[44px] place-items-center font-semibold tabular-nums transition-colors ${
                compact ? 'h-11 w-11 rounded-[12px] text-[13px]' : 'h-[52px] min-w-[52px] rounded-[15px] px-2 font-serif text-[20px]'
              } ${
                checked
                  ? 'bg-forest text-white'
                  : 'border border-line bg-cream text-muted hover:border-forest hover:text-forest'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {lowLabel || highLabel ? (
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  format?: (value: number) => string;
}

/** Large −/+ stepper (Figma sleep-hours input, 0.5 h steps). */
export function Stepper({ value, onChange, step = 1, min, max, label, format }: StepperProps) {
  const clamp = (v: number) => {
    if (min !== undefined && v < min) return min;
    if (max !== undefined && v > max) return max;
    return v;
  };
  const display = format ? format(value) : String(value);
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="icon"
        aria-label="Zmniejsz"
        onClick={() => onChange(clamp(value - step))}
        disabled={min !== undefined && value <= min}
      >
        <Minus size={20} strokeWidth={1.8} />
      </Button>
      <span
        role="status"
        aria-label={label}
        className="min-w-[88px] text-center font-serif text-[34px] font-semibold tabular-nums"
      >
        {display}
      </span>
      <Button
        variant="icon"
        aria-label="Zwiększ"
        onClick={() => onChange(clamp(value + step))}
        disabled={max !== undefined && value >= max}
      >
        <Plus size={20} strokeWidth={1.8} />
      </Button>
    </div>
  );
}
