import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check } from 'lucide-react';
import { useDashboard } from '../../../api/insights';
import { useCycleStatus } from '../../../api/tracking';
import { ForecastCard } from '../../insights/components/ForecastCard';
import { InsightCard } from '../../insights/components/InsightCard';
import { EpdsDueCard } from '../../epds/components/EpdsDueCard';

/**
 * NOTE(f-daily): TopStrategiesCards (features/support), TodayGoalsCard
 * (features/goals) and WinsJarCard (features/wins) belong to f-care/f-plan
 * and do not exist yet. Local fallbacks below render the same slots from
 * /dashboard data; the integrator swaps them for the real widgets.
 * Logged in docs/agents/requests/f-daily.md.
 */
function GoalsFallback({ goals }: { goals: Array<{ id: number; title: string; done_today: boolean }> }) {
  const { t } = useTranslation('today');
  const done = goals.filter((g) => g.done_today).length;
  return (
    <section aria-label="today-goals" style={sideCard}>
      <div style={sideHead}>
        <h2 style={sideTitle}>{t('goalsToday')}</h2>
        <span style={muted}>{t('goalsDoneOf', { done, total: goals.length })}</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {goals.map((g) => (
          <div key={g.id} style={goalRow}>
            <span style={g.done_today ? checkDone : checkTodo}>
              {g.done_today && <Check size={15} strokeWidth={2.2} />}
            </span>
            <strong style={{ fontSize: 14 }}>{g.title}</strong>
          </div>
        ))}
      </div>
      <div style={bar}>
        <span style={{ width: goals.length ? `${(done / goals.length) * 100}%` : 0 }} />
      </div>
      <Link to="/goals" style={link}>
        {t('seeAll')} <ArrowRight size={16} strokeWidth={1.8} />
      </Link>
    </section>
  );
}

function WinsFallback() {
  const { t } = useTranslation('today');
  return (
    <section aria-label="wins" style={sideCard}>
      <h2 style={sideTitle}>Słoik wygranych</h2>
      <p style={muted}>Drobne rzeczy też się liczą.</p>
      <Link to="/support" style={link}>
        {t('winsAdd')} <ArrowRight size={16} strokeWidth={1.8} />
      </Link>
    </section>
  );
}

function StrategiesFallback() {
  const { t } = useTranslation('today');
  return (
    <div style={recGrid}>
      <article style={{ ...recCard, borderColor: 'var(--forest, #3f6959)' }}>
        <p style={eyebrow}>{t('bestMatch')}</p>
        <h3 style={recTitle}>10 minut odpoczynku bez telefonu</h3>
        <p style={recBody}>Ta strategia pomagała Ci w 4 z 5 trudniejszych dni.</p>
        <div style={recFoot}>
          <span style={muted}>10 min</span>
          <Link to="/support" aria-label="open" style={roundBtn}>
            <ArrowRight size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </article>
      <article style={recCard}>
        <p style={eyebrow}>Delikatny ruch</p>
        <h3 style={recTitle}>Krótki spacer w Twoim tempie</h3>
        <p style={recBody}>Świeże powietrze może pomóc rozluźnić ciało i myśli.</p>
        <div style={recFoot}>
          <span style={muted}>5–15 min</span>
          <Link to="/support" aria-label="open" style={roundBtn}>
            <ArrowRight size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </article>
    </div>
  );
}

function greetingKey(hour: number) {
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Whole calendar days from `from` until ISO `dateStr`. Pure, unit-tested. */
export function daysUntil(dateStr: string | null, from: Date = new Date()): number | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export default function TodayPage() {
  const { t } = useTranslation('today');
  const dashboard = useDashboard();
  const status = useCycleStatus();
  const d = dashboard.data;
  const hour = new Date().getHours();
  const name = 'Marta';

  return (
    <main style={main}>
      <div style={grid}>
        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <section style={welcome}>
            <div>
              <p style={eyebrow}>{t(greetingKey(hour), { name })}</p>
              <h1 style={h1}>{t('subtitle')}</h1>
              <p style={muted}>{t('subcopy')}</p>
            </div>
            {status.data?.mode === 'postpartum' && status.data.postpartum_week != null && (
              <div style={stagePill}>
                <span style={stageNum}>{status.data.postpartum_week}</span>
                <span>
                  <strong style={{ display: 'block', fontSize: 14 }}>{t('stageWeek')}</strong>
                  <small style={muted}>{t('stageDay', { day: status.data.days_since_birth ?? '–' })}</small>
                </span>
              </div>
            )}
            {status.data?.mode === 'cycle' && (
              <div style={stagePill}>
                <span style={ring} role="img" aria-label="cycle phase">
                  {status.data.cycle_day ?? '–'}
                </span>
                <span>
                  <strong style={{ display: 'block', fontSize: 14 }}>
                    {t('cycleDay')} {status.data.cycle_day ?? '–'}
                    {status.data.phase ? ` · ${t(`phase${cap(status.data.phase)}`)}` : ''}
                  </strong>
                  <small style={muted}>
                    {(() => {
                      const n = daysUntil(status.data.next_period_date);
                      return n == null ? '' : t('periodIn', { n });
                    })()}
                  </small>
                </span>
              </div>
            )}
          </section>

          {!dashboard.isLoading && !d?.today_checkin ? (
            <section style={hero}>
              <div style={{ flex: 1 }}>
                <p style={duration}>◌ ◌ {t('checkinAbout')}</p>
                <h2 style={heroTitle}>{t('checkinTitle')}</h2>
                <p style={heroBody}>{t('checkinBody')}</p>
                <Link to="/checkin" style={primaryLink}>
                  {t('checkinCta')} <ArrowRight size={18} strokeWidth={1.8} />
                </Link>
              </div>
            </section>
          ) : d?.today_checkin ? (
            <section style={heroDone}>
              <p style={eyebrowLight}>{t('goalsToday')}</p>
              <p style={heroBody}>
                {t('daySummary', {
                  mood: d.today_checkin.mood ?? '–',
                  sleep: d.today_checkin.sleep_hours ?? '–',
                  energy: d.today_checkin.energy ?? '–',
                })}
              </p>
              <Link to="/checkin" style={peachLink}>
                {t('edit')}
              </Link>
            </section>
          ) : (
            <section aria-busy="true" style={hero}>
              <div style={{ height: 24, width: '50%', background: '#ffffff33', borderRadius: 8 }} />
            </section>
          )}

          <ForecastCard />

          <section>
            <div style={secHead}>
              <div>
                <p style={eyebrow}>{t('forToday')}</p>
              </div>
              <Link to="/support" style={link}>
                {t('seeAll')} <ArrowRight size={16} strokeWidth={1.8} />
              </Link>
            </div>
            <StrategiesFallback />
          </section>

          <InsightCard data={d?.insight} />
        </div>

        <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <GoalsFallback goals={d?.today_goals ?? []} />
          <EpdsDueCard />
          <WinsFallback />
          {d?.article_of_day && (
            <section style={sideCard}>
              <p style={muted}>{t('minRead', { n: d.article_of_day.reading_minutes })}</p>
              <h3 style={recTitle}>{d.article_of_day.title}</h3>
              <Link to={`/knowledge/${d.article_of_day.slug}`} style={link}>
                {t('articleCta')} <ArrowRight size={16} strokeWidth={1.8} />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

const main: React.CSSProperties = { padding: '24px 20px 80px', maxWidth: 1340, margin: '0 auto' };
const grid: React.CSSProperties = {
  display: 'grid', gap: 24, gridTemplateColumns: 'minmax(0, 1fr)',
};
const welcome: React.CSSProperties = { display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' };
const h1: React.CSSProperties = {
  fontFamily: 'Newsreader, serif', fontSize: 'clamp(38px, 4vw, 53px)',
  lineHeight: 1.06, letterSpacing: -1.2, margin: '4px 0 6px', color: 'var(--ink, #25342f)',
};
const eyebrow: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
  color: 'var(--forest, #3f6959)', margin: 0,
};
const eyebrowLight: React.CSSProperties = { ...eyebrow, color: 'var(--peach-soft, #f5e1d6)' };
const muted: React.CSSProperties = { fontSize: 13, color: 'var(--muted, #718079)', margin: 0 };
const stagePill: React.CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'center', background: 'var(--paper, #fffdf9)',
  border: '1px solid var(--line, #e5e7df)', borderRadius: 999, padding: '8px 18px 8px 8px',
};
const ring: React.CSSProperties = {
  fontFamily: 'Newsreader, serif', fontSize: 22, fontWeight: 600,
  border: '3px solid var(--sage, #dfeae2)', borderTopColor: 'var(--forest, #3f6959)',
  borderRadius: '50%', width: 56, height: 56, minWidth: 56,
  display: 'grid', placeItems: 'center', color: 'var(--forest-deep, #315648)',
};
const stageNum: React.CSSProperties = {
  fontFamily: 'Newsreader, serif', fontSize: 34, fontWeight: 600,
  background: 'var(--sage, #dfeae2)', borderRadius: '50%', width: 56, height: 56,
  display: 'grid', placeItems: 'center', color: 'var(--forest-deep, #315648)',
};
const hero: React.CSSProperties = {
  background: 'var(--forest, #3f6959)', color: '#fff', borderRadius: 28,
  padding: 28, boxShadow: '0 18px 50px #374c4214',
};
const heroDone: React.CSSProperties = { ...hero, background: 'var(--forest-deep, #315648)' };
const duration: React.CSSProperties = { fontSize: 12, opacity: 0.85, margin: '0 0 8px' };
const heroTitle: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 27, margin: '0 0 8px' };
const heroBody: React.CSSProperties = { fontSize: 14, lineHeight: 1.55, margin: '0 0 16px', opacity: 0.95 };
const primaryLink: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46,
  background: 'var(--peach-soft, #f5e1d6)', color: '#684b3d', fontWeight: 700,
  borderRadius: 14, padding: '0 22px', textDecoration: 'none', fontSize: 15,
};
const peachLink: React.CSSProperties = { ...primaryLink, marginTop: 8 };
const secHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const link: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14,
  fontWeight: 600, color: 'var(--forest, #3f6959)',
};
const recGrid: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' };
const recCard: React.CSSProperties = {
  background: 'var(--paper, #fffdf9)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20, padding: 18,
};
const recTitle: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 21, margin: '4px 0', color: 'var(--ink, #25342f)' };
const recBody: React.CSSProperties = { fontSize: 13, color: 'var(--ink, #25342f)', margin: '0 0 12px' };
const recFoot: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const roundBtn: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: '50%',
  background: 'var(--forest, #3f6959)', color: '#fff', textDecoration: 'none',
};
const sideCard: React.CSSProperties = {
  background: 'var(--paper, #fffdf9)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20, padding: 18,
};
const sideHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 };
const sideTitle: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 21, margin: 0, color: 'var(--ink, #25342f)' };
const goalRow: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center' };
const checkDone: React.CSSProperties = {
  display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%',
  background: 'var(--forest, #3f6959)', color: '#fff',
};
const checkTodo: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--line, #e5e7df)',
};
const bar: React.CSSProperties = {
  height: 8, borderRadius: 999, background: 'var(--sage-light, #f1f5f0)', marginTop: 12, overflow: 'hidden',
};
