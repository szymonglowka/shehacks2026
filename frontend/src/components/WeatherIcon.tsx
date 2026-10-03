export type Outlook = 'sunny' | 'partly' | 'cloudy' | 'rainy';

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Hand-drawn line weather icons (never emoji) for the forecast card. */
export function WeatherIcon({ outlook, size = 28 }: { outlook: Outlook; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" {...common}>
      {outlook === 'sunny' && (
        <g>
          <circle cx="14" cy="14" r="5.2" />
          <path d="M14 3.5v2.6M14 21.9v2.6M3.5 14h2.6M21.9 14h2.6M6.7 6.7l1.8 1.8M19.5 19.5l1.8 1.8M21.3 6.7l-1.8 1.8M8.5 19.5l-1.8 1.8" />
        </g>
      )}
      {outlook === 'partly' && (
        <g>
          <circle cx="10.5" cy="10.5" r="4" />
          <path d="M10.5 3v2M3 10.5h2M5.3 5.3l1.4 1.4M15.7 5.3l-1.4 1.4" />
          <path d="M10 22.5h10.5a3.8 3.8 0 0 0 .6-7.5 5.2 5.2 0 0 0-10.1 1.4 3 3 0 0 0-1 6.1Z" />
        </g>
      )}
      {outlook === 'cloudy' && (
        <path d="M7 21.5h12.5a4.3 4.3 0 0 0 .7-8.5 5.8 5.8 0 0 0-11.3 1.6 3.4 3.4 0 0 0-1.9 6.9Z" />
      )}
      {outlook === 'rainy' && (
        <g>
          <path d="M7.5 17.5h12a4 4 0 0 0 .6-7.9 5.4 5.4 0 0 0-10.5 1.5 3.1 3.1 0 0 0-2.1 6.4Z" />
          <path d="M9.5 21l-1 2.4M14.5 21l-1 2.4M19.5 21l-1 2.4" />
        </g>
      )}
    </svg>
  );
}
