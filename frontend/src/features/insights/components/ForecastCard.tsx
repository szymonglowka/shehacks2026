import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';
import { useForecastTomorrow, type Forecast } from '../../../api/insights';

const OUTLOOK_ICON = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
} as const;

export function ForecastCard({ data }: { data?: Forecast }) {
  const { t } = useTranslation('today');
  const query = useForecastTomorrow();
  const fc = data ?? query.data;
  if (query.isLoading && !data) {
    return (
      <section aria-busy="true" style={card}>
        <div style={{ height: 20, width: '60%', background: 'var(--sage-light)', borderRadius: 8 }} />
      </section>
    );
  }
  if (query.isError && !data) return null;
  if (!fc) return null;
  const Icon = OUTLOOK_ICON[fc.outlook];
  return (
    <section aria-label="forecast" style={card}>
      <span style={iconTile}>
        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div style={{ flex: 1 }}>
        <p style={title}>{t(`forecast${cap(fc.outlook)}`)}</p>
        <p style={tip}>{t(`tip${cap(fc.tip_code)}`)}</p>
        <p style={hint}>{t('forecastHint')}</p>
      </div>
    </section>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const card: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  background: 'var(--paper, #fffdf9)',
  border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20,
  padding: 16,
};

const iconTile: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  minWidth: 44,
  minHeight: 44,
  borderRadius: 14,
  background: 'var(--sage, #dfeae2)',
  color: 'var(--forest, #3f6959)',
};

const title: React.CSSProperties = {
  fontFamily: 'Newsreader, serif',
  fontSize: 19,
  fontWeight: 600,
  margin: 0,
  color: 'var(--ink, #25342f)',
};

const tip: React.CSSProperties = { fontSize: 14, margin: '4px 0 2px', color: 'var(--ink, #25342f)' };
const hint: React.CSSProperties = {
  fontSize: 11,
  fontStyle: 'italic',
  margin: 0,
  color: 'var(--muted, #718079)',
};

export function ForecastLink() {
  return <Link to="/patterns" aria-hidden="true" tabIndex={-1} style={{ display: 'none' }} />;
}
