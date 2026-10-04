import { MARK_PATHS, MARK_VIEWBOX, WORD_PATH, WORD_VIEWBOX } from './brandPaths';

/** Logo mark (official Otula petals, fixed brand colours). */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={MARK_VIEWBOX} aria-hidden="true">
      {MARK_PATHS.map((p) => (
        <path key={p.d.slice(0, 24)} fill={p.fill} d={p.d} />
      ))}
    </svg>
  );
}

/** Wordmark "otula"; colour follows the theme (--brand-word: logo brown by day, light beige at night). */
export function BrandWord({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      width={(height * 259) / 87}
      viewBox={WORD_VIEWBOX}
      role="img"
      aria-label="otula"
    >
      <path fill="var(--brand-word)" fillRule="evenodd" d={WORD_PATH} />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size={compact ? 30 : 38} />
      <BrandWord height={compact ? 18 : 22} />
    </span>
  );
}
