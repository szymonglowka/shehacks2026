import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useInsights } from '../../../api/insights';

export default function PatternsPage() {
  const { t } = useTranslation('patterns');
  const [range, setRange] = useState<7 | 30>(30);
  const { data, isLoading, isError } = useInsights(range);

  return (
    <main style={main}>
      <div style={head}>
        <h1 style={h1}>{t('title', { n: range })}</h1>
        <div style={seg} role="group" aria-label="range">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              style={range === r ? segOn : segOff}
            >
              {t(r === 7 ? 'range7' : 'range30')}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <section aria-busy="true" style={card}>
          <div style={{ height: 220, background: 'var(--sage-light)', borderRadius: 12 }} />
        </section>
      )}
      {isError && <p>{t('noData')}</p>}

      {data && (
        <>
          <section aria-label={t('moodRibbon')} style={card}>
            <h2 style={h2}>{t('moodRibbon')}</h2>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <ComposedChart data={data.series} margin={{ top: 24, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid vertical={false} stroke="transparent" />
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis domain={[1, 5]} ticks={[1, 5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="sleep_hours" fill="#dfeae2" barSize={10} radius={[4, 4, 0, 0]} />
                  <Area type="monotone" dataKey="mood" fill="#3f695933" stroke="none" />
                  <Line type="monotone" dataKey="mood" stroke="#3f6959" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Hand-written annotations — the human touch (SCREENS §0). */}
            <div style={annotWrap}>
              <p style={annot}><i style={leader} />↳ {t('annotFirstWalk')}</p>
              <p style={annot}><i style={leader} />↳ {t('annotSleepless')}</p>
            </div>
          </section>

          <section style={findGrid} aria-label="findings">
            {[
              { n: '+24%', text: t('findingSleep') },
              { n: '4/5', text: t('findingWalk') },
              { n: '☾', text: t('findingSunday', { day: t('sundays') }) },
            ].map((f, i) => (
              <article key={i} style={findCard}>
                <span style={serifNum}>{f.n}</span>
                <p style={findText}>{f.text}</p>
              </article>
            ))}
          </section>

          <section aria-label={t('epdsTimeline')} style={card}>
            <h2 style={h2}>{t('epdsTimeline')}</h2>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <ComposedChart
                  data={data.epds_history.map((e) => ({ date: e.created_at.slice(0, 10), total: e.total }))}
                  margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                >
                  <CartesianGrid vertical={false} stroke="transparent" />
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 30]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <ReferenceArea y1={10} y2={12} fill="#ddd8e9" fillOpacity={0.5} />
                  <ReferenceArea y1={13} y2={30} fill="#e9b9a0" fillOpacity={0.35} />
                  <Line type="monotone" dataKey="total" stroke="#3f6959" strokeWidth={2.5} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p style={hint}>{t('epdsNote')}</p>
          </section>

          <section aria-label={t('strategies')} style={card}>
            <h2 style={h2}>{t('strategies')}</h2>
            {[{ name: 'Krótki spacer', helped: 4, total: 5 }, { name: 'Ciepły napój bez telefonu', helped: 3, total: 4 }].map((s) => (
              <div key={s.name} style={{ margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <strong>{s.name}</strong>
                  <span>{t('helpedOf', { helped: s.helped, total: s.total })}</span>
                </div>
                <div style={barTrack}>
                  <span style={{ ...barFill, width: `${(s.helped / s.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </section>

          <Link to="/report" style={cta}>
            {t('reportCta')} <ArrowRight size={18} strokeWidth={1.8} />
          </Link>
          <p style={hint}>{t('reportHint')}</p>
        </>
      )}
    </main>
  );
}

const main: React.CSSProperties = { padding: '24px 20px 96px', maxWidth: 860, margin: '0 auto' };
const head: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 };
const h1: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 'clamp(30px, 4vw, 44px)', margin: 0 };
const h2: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 22, margin: '0 0 8px' };
const card: React.CSSProperties = {
  background: 'var(--paper, #fffdf9)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20, padding: 18, marginBottom: 16,
};
const seg: React.CSSProperties = { display: 'inline-flex', background: 'var(--sage-light, #f1f5f0)', borderRadius: 999, padding: 4, gap: 4 };
const segOn: React.CSSProperties = {
  border: 'none', borderRadius: 999, padding: '10px 20px', minHeight: 44,
  background: 'var(--forest, #3f6959)', color: 'var(--on-forest)', fontWeight: 600, cursor: 'pointer',
};
const segOff: React.CSSProperties = {
  border: 'none', borderRadius: 999, padding: '10px 20px', minHeight: 44,
  background: 'none', fontWeight: 600, cursor: 'pointer', color: 'var(--ink, #25342f)',
};
const annotWrap: React.CSSProperties = { display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 4 };
const annot: React.CSSProperties = { fontSize: 12, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif", color: 'var(--muted, #718079)', margin: 0 };
const leader: React.CSSProperties = { display: 'inline-block', width: 22, height: 1, background: 'var(--muted, #718079)', verticalAlign: 'middle', marginRight: 4 };
const findGrid: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 };
const findCard: React.CSSProperties = {
  background: 'var(--paper, #fffdf9)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20, padding: 16,
};
const serifNum: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 40, fontWeight: 600, color: 'var(--forest, #3f6959)' };
const findText: React.CSSProperties = { fontSize: 13, margin: '4px 0 0' };
const hint: React.CSSProperties = { fontSize: 12, fontStyle: 'italic', color: 'var(--muted, #718079)' };
const barTrack: React.CSSProperties = { height: 10, borderRadius: 999, background: 'var(--sage-light, #f1f5f0)', overflow: 'hidden', marginTop: 6 };
const barFill: React.CSSProperties = { display: 'block', height: '100%', background: 'var(--forest, #3f6959)', borderRadius: 999 };
const cta: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 24px',
  background: 'var(--forest, #3f6959)', color: 'var(--on-forest)', borderRadius: 14, fontWeight: 600, textDecoration: 'none',
};
