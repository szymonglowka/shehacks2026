export function PetalMark({
  filled,
  size = 40,
  label,
}: {
  filled: number;
  size?: number;
  label?: string;
}) {
  const petals = [0, 1, 2, 3];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <g transform="translate(18 18)">
        {petals.map((i) => (
          <path
            key={i}
            d="M0 -1.2C-9.5 -3.2 -9 -11.6 -6.4 -12.1c2.7 -.5 4.9 3.4 6.4 10.9Z"
            transform={`rotate(${i * 90})`}
            className={i < filled ? "fill-forest" : "fill-sage"}
            stroke="var(--line)"
            strokeWidth="0.6"
          />
        ))}
        <circle r="1.6" className="fill-peach" />
      </g>
    </svg>
  );
}

export function PetalWeek({
  done,
  total,
  size = 44,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const filled = total <= 0 ? 0 : Math.round((Math.min(done, total) / total) * 4);
  return (
    <PetalMark
      filled={filled}
      size={size}
      label={`${done} / ${total}`}
    />
  );
}
