import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useDashboard, type InsightCardData } from '../../../api/insights';

export function InsightCard({ data }: { data?: InsightCardData | null }) {
  const { t } = useTranslation('insights');
  const dashboard = useDashboard();
  const card = data ?? dashboard.data?.insight ?? null;
  if (dashboard.isLoading && !data) {
    return (
      <section aria-busy="true" style={wrap}>
        <div style={{ height: 18, width: '70%', background: 'var(--sage-light)', borderRadius: 8 }} />
      </section>
    );
  }
  if (!card) return null;
  return (
    <section aria-label="insight" style={wrap}>
      <span style={tile}>
        <TrendingUp size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div style={{ flex: 1 }}>
        <p style={eyebrow}>{t('seePatterns')}</p>
        <h3 style={title}>{insightTitle(t, card)}</h3>
        <p style={body}>{insightBody(t, card)}</p>
      </div>
      <Link
        to="/patterns"
        aria-label={t('seePatterns')}
        style={arrow}
      >
        <ArrowRight size={18} strokeWidth={1.8} />
      </Link>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function insightTitle(t: any, card: InsightCardData): string {
  switch (card.code) {
    case 'sleep_mood':
      return t('sleepMood');
    case 'goals_mood':
      return t('goalsMood');
    case 'trend':
      return card.params.direction === 'up' ? t('trendUp') : t('trendDown');
    case 'toolkit_top':
      return t('toolkitTop');
    default:
      return t('trendUp');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function insightBody(t: any, card: InsightCardData): string {
  const p = card.params as Record<string, string | number>;
  switch (card.code) {
    case 'sleep_mood':
      return t('sleepMoodBody', { pct: p.pct ?? 24 });
    case 'goals_mood':
      return t('goalsMoodBody');
    case 'trend':
      return p.direction === 'up' ? t('trendUpBody') : t('trendDownBody');
    case 'toolkit_top':
      return t('toolkitTopBody', { strategy: p.strategy, helped: p.helped, total: p.total });
    default:
      return '';
  }
}

const wrap: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  background: 'var(--card-lav-bg)',
  border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20,
  padding: 16,
};

const tile: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  minWidth: 44,
  borderRadius: 14,
  background: 'var(--lavender, #ddd8e9)',
  color: 'var(--ink, #25342f)',
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  color: 'var(--forest, #3f6959)',
  margin: 0,
};

const title: React.CSSProperties = {
  fontFamily: 'Newsreader, serif',
  fontSize: 20,
  fontWeight: 600,
  margin: '2px 0 4px',
  color: 'var(--ink, #25342f)',
};

const body: React.CSSProperties = { fontSize: 13, margin: 0, color: 'var(--ink, #25342f)' };

const arrow: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: '1px solid var(--line, #e5e7df)',
  color: 'var(--ink, #25342f)',
  textDecoration: 'none',
  flexShrink: 0,
};
