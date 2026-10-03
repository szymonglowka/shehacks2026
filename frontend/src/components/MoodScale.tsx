/** Shared mood scale colors (SCREENS §4) — mood 1..5. */
export const MOOD_COLORS = ['#c98b6b', '#dfb48f', '#e8d9b5', '#bcd3c2', '#7fa891'] as const;

export const MOOD_LABELS_PL = [
  'Bardzo trudno',
  'Trudno',
  'Różnie',
  'Dobrze',
  'Bardzo dobrze',
] as const;

interface MoodScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  labels?: readonly string[];
  legend: string;
  name?: string;
}

/**
 * 5-tile mood selector as an accessible radiogroup. The chosen tile takes
 * the mood-scale color; labels stay ≥11px (Figma used 7–8px — too small).
 */
export function MoodScale({ value, onChange, labels = MOOD_LABELS_PL, legend, name = 'mood' }: MoodScaleProps) {
  return (
    <div role="radiogroup" aria-label={legend} className="grid grid-cols-5 gap-2">
      {labels.map((label, index) => {
        const mood = index + 1;
        const checked = value === mood;
        return (
          <button
            key={mood}
            type="button"
            role="radio"
            aria-checked={checked}
            name={name}
            onClick={() => onChange(mood)}
            className="mood-tile min-h-[76px] min-w-0 rounded-[15px] border px-1 pb-2.5 pt-3 transition-colors"
            style={
              checked
                ? {
                    borderColor: 'var(--forest)',
                    backgroundColor: MOOD_COLORS[index],
                    color: 'var(--ink)',
                  }
                : {
                    borderColor: 'var(--line)',
                    backgroundColor: 'var(--cream)',
                    color: 'var(--muted)',
                  }
            }
          >
            <span className="block font-serif text-[23px] font-semibold">{mood}</span>
            <small className="mt-1.5 block text-[11px] leading-tight">{label}</small>
          </button>
        );
      })}
    </div>
  );
}
