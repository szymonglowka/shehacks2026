import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCheckins, useCreatePeriod, useCycleStatus, useDeletePeriod, usePeriodReturned, usePeriods, useUpdatePeriod } from '../../../api/tracking';
import { MOOD_COLORS } from '../../checkin/pages/CheckinPage';

function monthRange(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const cells: Date[] = [];
  for (let i = -startPad; i < 42 - startPad; i += 1) {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { t } = useTranslation('calendar');
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const cells = useMemo(() => monthRange(cursor), [cursor]);
  const from = iso(cells[0]);
  const to = iso(cells[cells.length - 1]);
  const { data: checkins } = useCheckins(from, to);
  const { data: status } = useCycleStatus();
  const { data: periods } = usePeriods();
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const deletePeriod = useDeletePeriod();
  const periodReturned = usePeriodReturned();

  const moodByDate = useMemo(() => new Map((checkins ?? []).map((c) => [c.date, c.mood])), [checkins]);
  const periodDays = useMemo(() => {
    const set = new Set<string>();
    (periods ?? []).forEach((p) => {
      const s = new Date(`${p.start_date}T12:00:00`);
      const e = p.end_date ? new Date(`${p.end_date}T12:00:00`) : s;
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) set.add(iso(d));
    });
    return set;
  }, [periods]);

  const openPeriod = (periods ?? []).find((p) => p.end_date == null);
  const sel = selected ? (checkins ?? []).find((c) => c.date === selected) : undefined;
  const postpartum = status?.mode === 'postpartum' ? status : null;

  return (
    <main style={main}>
      <div style={seg} role="tablist" aria-label="view">
        <button type="button" role="tab" aria-selected="true" style={segOn}>{t('month')}</button>
        <Link to="/patterns" role="tab" aria-selected="false" style={segOff}>{t('patterns')}</Link>
      </div>

      {postpartum && (
        <div style={strip} aria-label="postpartum-weeks">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
            <span key={w} style={w === postpartum.postpartum_week ? weekOn : week}>
              {w}
            </span>
          ))}
          <small style={mile}>{t('milestone6')}</small>
        </div>
      )}

      <div style={monthHead}>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} style={navBtn} aria-label="prev">‹</button>
        <h1 style={h1}>
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h1>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} style={navBtn} aria-label="next">›</button>
      </div>

      <div style={grid} role="grid" aria-label={t('title')}>
        {cells.map((d) => {
          const key = iso(d);
          const mood = moodByDate.get(key);
          const inMonth = d.getMonth() === cursor.getMonth();
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-label={key}
              onClick={() => setSelected(key)}
              style={{ ...cell, opacity: inMonth ? 1 : 0.4 }}
            >
              <span style={dayNum}>{d.getDate()}</span>
              <span
                style={{
                  ...dot,
                  background: mood != null ? MOOD_COLORS[mood - 1] : 'transparent',
                  border: mood != null ? 'none' : '1px solid var(--line, #e5e7df)',
                }}
              />
              {periodDays.has(key) && <span style={periodLine} />}
            </button>
          );
        })}
      </div>

      <div style={legend}>
        <span><i style={{ ...lg, background: '#c98b6b' }} /> {t('legendPeriod')}</span>
        <span><i style={{ ...lg, borderTop: '2px dashed #c98b6b', height: 0 }} /> {t('legendPredicted')}</span>
      </div>

      <div style={actions}>
        {openPeriod ? (
          <>
            <button
              type="button"
              onClick={() => selected && updatePeriod.mutate({ id: openPeriod.id, end_date: selected })}
              style={primary}
            >
              {t('periodEnded')}
            </button>
            <button type="button" onClick={() => deletePeriod.mutate(openPeriod.id)} style={ghost}>
              ×
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => createPeriod.mutate({ start_date: selected ?? iso(new Date()) })}
            style={primary}
          >
            {t('periodStarted')}
          </button>
        )}
        {postpartum && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('periodReturnedConfirm'))) {
                periodReturned.mutate({ start_date: selected ?? iso(new Date()) });
              }
            }}
            style={ghost}
          >
            {t('periodReturned')}
          </button>
        )}
      </div>

      {selected && (
        <section aria-label={t('daySummary')} style={sheet}>
          <h2 style={h2}>{selected}</h2>
          {sel ? (
            <>
              <p style={body}>{t('mood')}: {sel.mood}/5 · {t('sleep')}: {sel.sleep_hours} h · {t('energy')}: {sel.energy}/5</p>
              <Link to="/checkin" style={link}>{t('editCheckin')}</Link>
            </>
          ) : (
            <>
              <p style={body}>{t('noCheckin')}</p>
              <Link to="/checkin" style={link}>{t('addCheckin')}</Link>
            </>
          )}
          <button type="button" onClick={() => setSelected(null)} style={ghost}>×</button>
        </section>
      )}
    </main>
  );
}

const main: React.CSSProperties = { padding: '24px 20px 96px', maxWidth: 900, margin: '0 auto' };
const seg: React.CSSProperties = {
  display: 'inline-flex', background: 'var(--sage-light, #f1f5f0)', borderRadius: 999, padding: 4, gap: 4,
};
const segOn: React.CSSProperties = {
  border: 'none', borderRadius: 999, padding: '10px 22px', minHeight: 44,
  background: 'var(--forest, #3f6959)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const segOff: React.CSSProperties = {
  borderRadius: 999, padding: '10px 22px', color: 'var(--ink, #25342f)',
  fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block',
};
const strip: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', margin: '16px 0', flexWrap: 'wrap' };
const week: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
  border: '1px solid var(--line, #e5e7df)', fontSize: 12,
};
const weekOn: React.CSSProperties = { ...week, background: 'var(--forest, #3f6959)', color: '#fff', borderColor: 'var(--forest, #3f6959)', fontWeight: 700 };
const mile: React.CSSProperties = { fontSize: 11, color: 'var(--muted, #718079)', fontStyle: 'italic' };
const monthHead: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px' };
const h1: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 30, margin: 0, textTransform: 'capitalize' };
const h2: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 22, margin: '0 0 8px' };
const navBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--line, #e5e7df)',
  background: 'var(--paper, #fffdf9)', fontSize: 22, cursor: 'pointer',
};
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 };
const cell: React.CSSProperties = {
  aspectRatio: '0.86', border: '1px solid var(--line, #e5e7df)', borderRadius: 12,
  background: 'var(--paper, #fffdf9)', cursor: 'pointer', display: 'grid',
  justifyItems: 'center', alignContent: 'start', paddingTop: 6, gap: 3, minHeight: 56,
};
const dayNum: React.CSSProperties = { fontSize: 13, fontVariantNumeric: 'tabular-nums' };
const dot: React.CSSProperties = { width: 12, height: 12, borderRadius: '50%' };
const periodLine: React.CSSProperties = { height: 3, width: '70%', borderRadius: 999, background: '#c98b6b' };
const legend: React.CSSProperties = { display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted, #718079)', marginTop: 12 };
const lg: React.CSSProperties = { display: 'inline-block', width: 22, height: 8, borderRadius: 999, marginRight: 6, verticalAlign: 'middle' };
const actions: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' };
const primary: React.CSSProperties = {
  minHeight: 46, padding: '0 22px', borderRadius: 14, border: 'none',
  background: 'var(--forest, #3f6959)', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer',
};
const ghost: React.CSSProperties = {
  minHeight: 46, padding: '0 18px', borderRadius: 14, border: '1px solid var(--line, #e5e7df)',
  background: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--ink, #25342f)',
};
const sheet: React.CSSProperties = {
  marginTop: 16, background: 'var(--paper, #fffdf9)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 20, padding: 18,
};
const body: React.CSSProperties = { fontSize: 14, margin: '0 0 8px' };
const link: React.CSSProperties = { color: 'var(--forest, #3f6959)', fontWeight: 600, fontSize: 14 };
