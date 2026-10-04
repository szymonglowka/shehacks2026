import { MARK_PATHS, MARK_VIEWBOX, WORD_PATH, WORD_RATIO, WORD_TRANSFORM, WORD_VIEWBOX } from './brandPaths';

/** Logo mark (official Otula leaves, fixed brand colours). */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={MARK_VIEWBOX} aria-hidden="true">
      {MARK_PATHS.map((p) => (
        <path key={p.d.slice(0, 24)} fill={p.fill} transform={p.transform} fillRule="evenodd" d={p.d} />
      ))}
    </svg>
  );
}

/** Wordmark "otula"; colour follows the theme (--brand-word: logo brown by day, light beige at night). */
export function BrandWord({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      width={height * WORD_RATIO}
      viewBox={WORD_VIEWBOX}
      role="img"
      aria-label="otula"
    >
      <path fill="var(--brand-word)" transform={WORD_TRANSFORM} d={WORD_PATH} />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size={compact ? 32 : 40} />
      <BrandWord height={compact ? 20 : 24} />
    </span>
  );
}
