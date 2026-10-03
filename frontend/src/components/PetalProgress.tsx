import { BrandMark } from './Brand';

interface PetalProgressProps {
  /** Filled petals (0..total). */
  value: number;
  total?: number;
  label: string;
}

/** 4-petal fill indicator (onboarding progress, closing petals on goals). */
export function PetalProgress({ value, total = 4, label }: PetalProgressProps) {
  return (
    <div role="img" aria-label={label} className="inline-flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block h-3 w-3 rounded-[70%_30%_65%_35%] transition-colors"
          style={{ backgroundColor: i < value ? 'var(--forest)' : 'var(--line)' }}
        />
      ))}
    </div>
  );
}

interface PetalBarProps {
  steps: number;
  done: number;
  label: string;
}

/** N-step petal bar (check-in "1 z 4", EPDS 10 petals). */
export function PetalBar({ steps, done, label }: PetalBarProps) {
  return (
    <div role="img" aria-label={label} className="flex items-center justify-center gap-1.5">
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-1.5 rounded-full transition-all ${i < done ? 'w-[18px] bg-forest' : 'w-1.5 bg-line'}`}
        />
      ))}
    </div>
  );
}

/** Closing-petals finale mark (onboarding "Gotowe" animation target). */
export function PetalFinale({ size = 72 }: { size?: number }) {
  return (
    <span className="otula-petals-close inline-grid place-items-center text-forest">
      <BrandMark size={size} />
    </span>
  );
}
