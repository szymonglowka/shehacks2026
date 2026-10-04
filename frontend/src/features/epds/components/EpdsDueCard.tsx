import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Heart } from 'lucide-react';
import { useEpdsDue } from '../../../api/tracking';

export function EpdsDueCard() {
  const { t } = useTranslation('epds');
  const { data, isLoading, isError } = useEpdsDue();
  if (isLoading) {
    return (
      <section aria-busy="true" style={wrap}>
        <div style={{ height: 18, width: '60%', background: 'var(--lavender)', borderRadius: 8 }} />
      </section>
    );
  }
  if (isError || !data?.due) return null;
  return (
    <section aria-label="epds-due" style={wrap}>
      <div style={top}>
        <span style={icon}>
          <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <h3 style={title}>{t('dueTitle')}</h3>
      <p style={body}>{t('dueBody')}</p>
      <Link to="/epds" style={cta}>
        {t('introStart')} <ArrowRight size={16} strokeWidth={1.8} />
      </Link>
    </section>
  );
}

const wrap: React.CSSProperties = {
  background: 'var(--card-lav-bg)',
  border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20,
  padding: 18,
};

const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const icon: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 38,
  height: 38,
  borderRadius: 12,
  background: 'var(--lavender, #ddd8e9)',
  color: 'var(--ink, #25342f)',
};

const title: React.CSSProperties = {
  fontFamily: 'Newsreader, serif',
  fontSize: 21,
  fontWeight: 600,
  margin: '10px 0 4px',
  color: 'var(--ink, #25342f)',
};

const body: React.CSSProperties = { fontSize: 13, margin: '0 0 10px', color: 'var(--ink, #25342f)' };

const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--forest, #3f6959)',
};
