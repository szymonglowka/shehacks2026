import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCompleteOnboarding, useFinishOnboarding, useOnboardingOptions } from '../../../api/onboarding';
import { usePushSubscription } from '../../../api/push';

function PetalBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8 }} role="progressbar" aria-valuenow={step + 1} aria-valuemax={total} aria-label="progress">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" width="26" height="26" aria-hidden="true">
          <path
            d="M10 1.5C4 4 4.5 12 10 18.5 15.5 12 16 4 10 1.5Z"
            fill={i <= step ? 'var(--forest, #3f6959)' : 'none'}
            stroke="var(--forest, #3f6959)"
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

function PetalScale({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: string[] }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2, 3].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={labels[v]}
          title={labels[v]}
          onClick={() => onChange(v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, minWidth: 44, minHeight: 44 }}
        >
          <svg viewBox="0 0 20 20" width={18 + v * 5} height={18 + v * 5} aria-hidden="true">
            <path
              d="M10 1.5C4 4 4.5 12 10 18.5 15.5 12 16 4 10 1.5Z"
              fill={value >= v && value > 0 ? 'var(--forest, #3f6959)' : value === v && v === 0 ? 'var(--line, #e5e7df)' : 'none'}
              stroke="var(--forest, #3f6959)"
              strokeWidth="1.5"
              opacity={value === v ? 1 : 0.55}
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { t, i18n } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'postpartum' | 'cycle'>('postpartum');
  const [birthDate, setBirthDate] = useState('');
  const [delivery, setDelivery] = useState('cesarean');
  const [feeding, setFeeding] = useState('breast');
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [worsening, setWorsening] = useState<string[]>([]);
  const [contact, setContact] = useState({ name: '', relation: '', phone: '' });
  const [tone, setTone] = useState<'gentle' | 'motivating'>('gentle');
  const [reminder, setReminder] = useState('20:00');
  const [goalIds, setGoalIds] = useState<number[]>([]);
  const [pushTried, setPushTried] = useState(false);
  const [done, setDone] = useState(false);
  // f-core hook: permission + VAPID subscribe + POST /push/subscriptions.
  const push = usePushSubscription();
  const complete = useCompleteOnboarding();
  const finishOnboarding = useFinishOnboarding();

  const week = useMemo(() => {
    if (!birthDate) return 6;
    const days = Math.floor((Date.now() - new Date(birthDate).getTime()) / 86400000);
    return Math.max(1, Math.floor(days / 7) + 1);
  }, [birthDate]);

  const { data: options } = useOnboardingOptions({ mode, week, delivery_type: delivery });
  const picked = Object.values(scores).filter((v) => v > 0).length;
  // Preselect the recommended goals once (real template ids come from the API).
  const goalsInit = useRef(false);
  useEffect(() => {
    if (goalsInit.current || !options?.goal_templates.length) return;
    goalsInit.current = true;
    setGoalIds(options.goal_templates.slice(0, 3).map((g) => g.id));
  }, [options]);

  const finish = () => {
    complete.mutate(
      {
        profile: {
          display_name: name || 'Marta',
          language: (i18n.language.startsWith('en') ? 'en' : 'pl') as 'pl' | 'en',
          mode,
          birth_date: mode === 'postpartum' ? birthDate || null : null,
          delivery_type: delivery as 'vaginal' | 'cesarean' | 'undisclosed',
          feeding: feeding as 'breast' | 'mixed' | 'formula' | 'na',
          last_period_date: mode === 'cycle' ? lastPeriod || null : null,
          avg_cycle_length: cycleLen,
          avg_period_length: periodLen,
          tone,
          checkin_reminder_time: reminder,
          worsening_factors: worsening,
        },
        coping_scores: scores as Record<string, 0 | 1 | 2 | 3>,
        worsening_factors: worsening,
        trusted_contact: contact.name
          ? { name: contact.name, relation: contact.relation, phone: contact.phone, preferred_channel: 'sms' }
          : null,
        goal_template_ids: goalIds,
        custom_goals: [],
      },
      { onSuccess: () => setDone(true) },
    );
  };

  if (done) {
    return (
      <main style={page}>
        <div style={finale}>
          <svg viewBox="0 0 36 36" width="72" height="72" aria-hidden="true" style={bloom}>
            <g fill="var(--forest, #3f6959)">
              <path d="M18 17.8C6 15.2 7 4.9 11.3 4.1c4.5-.9 6.4 5.7 6.7 13.7Z" />
              <path d="M18 17.8C30 15.2 29 4.9 24.7 4.1c-4.5-.9-6.4 5.7-6.7 13.7Z" />
              <path d="M18 18.2C6 20.8 7 31.1 11.3 31.9c4.5.9 6.4-5.7 6.7-13.7Z" />
              <path d="M18 18.2c12 2.6 11 12.9 6.7 13.7-4.5.9-6.4-5.7-6.7-13.7Z" />
            </g>
          </svg>
          <h1 style={h1}>{t('doneTitle', { name: name || 'Marta' })}</h1>
          <p style={body}>{t('doneBody')}</p>
          <button type="button" onClick={() => void finishOnboarding().then(() => navigate("/today"))} style={primary}>
            {t('doneCta')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <PetalBar step={step} total={7} />
      <div style={cols}>
        <div>
          <p style={serifNum}>0{step + 1}</p>
          <p style={why}>
            {step === 0 && t('nameWhy')}
            {step === 1 && t('modeWhy')}
            {step === 2 && (mode === 'postpartum' ? t('detailsWhyPostpartum') : t('detailsWhyCycle'))}
            {step === 3 && t('copingWhy')}
            {step === 4 && t('worseningWhy')}
            {step === 5 && t('circleWhy')}
            {step === 6 && t('goalsWhy')}
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {step === 0 && (
            <>
              <h1 style={h1}>{t('nameTitle')}</h1>
              <label style={lbl} htmlFor="ob-name">{t('nameLabel')}</label>
              <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} style={input} autoComplete="given-name" />
              <label style={lbl} htmlFor="ob-lang">{t('langLabel')}</label>
              <div style={pills}>
                {(['pl', 'en'] as const).map((l) => (
                  <button key={l} id={l === 'pl' ? 'ob-lang' : undefined} type="button" onClick={() => i18n.changeLanguage(l)} aria-pressed={i18n.language.startsWith(l)} style={i18n.language.startsWith(l) ? pillOn : pill}>
                    {l === 'pl' ? 'Polski' : 'English'}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 style={h1}>{t('modeTitle')}</h1>
              <div style={modeGrid}>
                <button type="button" onClick={() => setMode('postpartum')} aria-pressed={mode === 'postpartum'} style={mode === 'postpartum' ? modeOn : modeCard}>
                  <strong style={modeTitle}>{t('modePostpartum')}</strong>
                  <span style={muted}>{t('modePostpartumDesc')}</span>
                </button>
                <button type="button" onClick={() => setMode('cycle')} aria-pressed={mode === 'cycle'} style={mode === 'cycle' ? modeOn : modeCard}>
                  <strong style={modeTitle}>{t('modeCycle')}</strong>
                  <span style={muted}>{t('modeCycleDesc')}</span>
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 style={h1}>{t('detailsTitle')}</h1>
              {mode === 'postpartum' ? (
                <>
                  <label style={lbl} htmlFor="ob-birth">{t('birthDate')}</label>
                  <input id="ob-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={input} />
                  {birthDate && (
                    <p style={liveLine} dangerouslySetInnerHTML={{ __html: t('postpartumNow', { day: Math.max(1, Math.floor((Date.now() - new Date(birthDate).getTime()) / 86400000)), week }) }} />
                  )}
                  <p style={lbl}>{t('delivery')}</p>
                  <div style={pills}>
                    {(['vaginal', 'cesarean', 'undisclosed'] as const).map((d) => (
                      <button key={d} type="button" onClick={() => setDelivery(d)} aria-pressed={delivery === d} style={delivery === d ? pillOn : pill}>
                        {t(`delivery${cap(d)}`)}
                      </button>
                    ))}
                  </div>
                  <p style={lbl}>{t('feeding')}</p>
                  <div style={pills}>
                    {(['breast', 'mixed', 'formula', 'na'] as const).map((f) => (
                      <button key={f} type="button" onClick={() => setFeeding(f)} aria-pressed={feeding === f} style={feeding === f ? pillOn : pill}>
                        {t(`feeding${cap(f)}`)}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label style={lbl} htmlFor="ob-lp">{t('lastPeriod')}</label>
                  <input id="ob-lp" type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} style={input} />
                  <label style={lbl} htmlFor="ob-cl">{t('cycleLength')}: <span style={serif}>{cycleLen}</span> {t('days')}</label>
                  <input id="ob-cl" type="range" min={21} max={40} value={cycleLen} onChange={(e) => setCycleLen(Number(e.target.value))} style={range} />
                  <label style={lbl} htmlFor="ob-pl">{t('periodLength')}: <span style={serif}>{periodLen}</span> {t('days')}</label>
                  <input id="ob-pl" type="range" min={2} max={10} value={periodLen} onChange={(e) => setPeriodLen(Number(e.target.value))} style={range} />
                </>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h1 style={h1}>{t('copingTitle')}</h1>
              <p style={muted}>{t('copingCounter', { count: picked })}</p>
              <div style={{ display: 'grid', gap: 4, marginTop: 12 }}>
                {(options?.coping_strategies ?? []).map((s) => (
                  <div key={s.code} style={stratRow}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 15 }}>{s.name}</strong>
                      <p style={muted}>{s.description}</p>
                    </div>
                    <PetalScale
                      value={scores[s.code] ?? 0}
                      onChange={(v) => setScores({ ...scores, [s.code]: v })}
                      labels={[t('coping0'), t('coping1'), t('coping2'), t('coping3')]}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h1 style={h1}>{t('worseningTitle')}</h1>
              <div style={pills}>
                {(options?.worsening_factors ?? []).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setWorsening(worsening.includes(f) ? worsening.filter((x) => x !== f) : [...worsening, f])}
                    aria-pressed={worsening.includes(f)}
                    style={worsening.includes(f) ? pillOn : pill}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <h1 style={h1}>{t('circleTitle')}</h1>
              <label style={lbl} htmlFor="ob-cn">{t('circleName')}</label>
              <input id="ob-cn" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} style={input} autoComplete="off" />
              <label style={lbl} htmlFor="ob-cr">{t('circleRelation')}</label>
              <input id="ob-cr" value={contact.relation} onChange={(e) => setContact({ ...contact, relation: e.target.value })} style={input} autoComplete="off" />
              <label style={lbl} htmlFor="ob-cp">{t('circlePhone')}</label>
              <input id="ob-cp" type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} style={input} autoComplete="off" />
            </>
          )}
          {step === 6 && (
            <>
              <h1 style={h1}>{t('goalsTitle')}</h1>
              <p style={muted}>{t('goalsRecommended', { week })}</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {(options?.goal_templates ?? []).map((g) => (
                  <label key={g.id} style={goalRow}>
                    <input
                      type="checkbox"
                      checked={goalIds.includes(g.id)}
                      onChange={() => setGoalIds(goalIds.includes(g.id) ? goalIds.filter((x) => x !== g.id) : [...goalIds, g.id])}
                    />
                    <span><strong style={{ fontSize: 15 }}>{g.title}</strong><br /><small style={muted}>{g.description}</small></span>
                  </label>
                ))}
              </div>
              <p style={lbl}>{t('toneTitle')}</p>
              <div style={pills}>
                {(['gentle', 'motivating'] as const).map((x) => (
                  <button key={x} type="button" onClick={() => setTone(x)} aria-pressed={tone === x} style={tone === x ? pillOn : pill} title={t(x === 'gentle' ? 'toneGentleDesc' : 'toneMotivatingDesc')}>
                    {t(x === 'gentle' ? 'toneGentle' : 'toneMotivating')}
                  </button>
                ))}
              </div>
              <label style={lbl} htmlFor="ob-rem">{t('reminderTitle')}</label>
              <input id="ob-rem" type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} style={input} />
              <div style={pushCard}>
                <div>
                  <strong style={{ fontSize: 15 }}>{t('pushTitle')}</strong>
                  <p style={muted}>{t('pushBody')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPushTried(true);
                    push.mutate();
                  }}
                  style={primary}
                  disabled={push.permission === 'granted' || push.isPending || (pushTried && push.isSuccess)}
                >
                  {t('pushEnable')} {push.permission === 'granted' || (pushTried && push.isSuccess) ? '✓' : ''}
                </button>
                {pushTried && push.isError && (
                  <p style={muted}>{t('pushSkip')}</p>
                )}
              </div>
            </>
          )}

          <div style={nav}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} style={ghost}>
                <ArrowLeft size={18} strokeWidth={1.8} /> {t('back')}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step === 5 && (
              <button type="button" onClick={() => setStep(6)} style={ghost}>
                {t('circleLater')}
              </button>
            )}
            {step < 6 ? (
              <button type="button" onClick={() => setStep(step + 1)} style={primary}>
                {t('next')} <ArrowRight size={18} strokeWidth={1.8} />
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={complete.isPending} style={primary}>
                {t('finish')}
              </button>
            )}
          </div>
          <p style={stepOf}>{t('stepOf', { step: step + 1 })}</p>
        </div>
      </div>
    </main>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const page: React.CSSProperties = { padding: '24px 20px 80px', maxWidth: 1000, margin: '0 auto' };
const cols: React.CSSProperties = { display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' };
const serifNum: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 88, fontWeight: 600, margin: 0, lineHeight: 1, color: 'var(--forest, #3f6959)' };
const serif: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 22 };
const why: React.CSSProperties = { fontSize: 14, fontStyle: 'italic', color: 'var(--muted, #718079)', maxWidth: 220 };
const h1: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.08, margin: '0 0 12px' };
const body: React.CSSProperties = { fontSize: 15, lineHeight: 1.6 };
const muted: React.CSSProperties = { fontSize: 13, color: 'var(--muted, #718079)', margin: '4px 0' };
const lbl: React.CSSProperties = { fontSize: 14, fontWeight: 600, margin: '16px 0 6px', display: 'block' };
const liveLine: React.CSSProperties = { fontSize: 14, margin: '8px 0' };
const input: React.CSSProperties = {
  width: '100%', maxWidth: 380, minHeight: 46, borderRadius: 14, fontSize: 16,
  border: '1px solid var(--line, #e5e7df)', padding: '0 14px', background: 'var(--paper, #fffdf9)',
  fontFamily: 'inherit',
};
const range: React.CSSProperties = { width: '100%', maxWidth: 380, minHeight: 44 };
const pills: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const pill: React.CSSProperties = {
  minHeight: 44, padding: '0 18px', borderRadius: 999, border: '1px solid var(--line, #e5e7df)',
  background: 'var(--paper, #fffdf9)', fontSize: 14, cursor: 'pointer',
};
const pillOn: React.CSSProperties = { ...pill, background: 'var(--forest, #3f6959)', borderColor: 'var(--forest, #3f6959)', color: '#fff', fontWeight: 600 };
const modeGrid: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' };
const modeCard: React.CSSProperties = {
  textAlign: 'left', borderRadius: 20, padding: 20, cursor: 'pointer',
  border: '1px solid var(--line, #e5e7df)', background: 'var(--paper, #fffdf9)',
};
const modeOn: React.CSSProperties = { ...modeCard, border: '2px solid var(--forest, #3f6959)' };
const modeTitle: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 22, display: 'block', marginBottom: 4 };
const stratRow: React.CSSProperties = {
  display: 'flex', gap: 12, alignItems: 'center', padding: '12px 4px',
  borderBottom: '1px solid var(--line, #e5e7df)',
};
const goalRow: React.CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12,
  border: '1px solid var(--line, #e5e7df)', borderRadius: 14, cursor: 'pointer',
};
const pushCard: React.CSSProperties = {
  marginTop: 20, padding: 16, borderRadius: 16, background: 'var(--sage-light, #f1f5f0)',
  display: 'grid', gap: 12,
};
const nav: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', marginTop: 24 };
const primary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 24px',
  background: 'var(--forest, #3f6959)', color: '#fff', border: 'none', borderRadius: 14,
  fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
const ghost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 18px',
  background: 'none', border: 'none', color: 'var(--muted, #718079)', fontSize: 14, cursor: 'pointer',
};
const stepOf: React.CSSProperties = { fontSize: 12, color: 'var(--muted, #718079)', marginTop: 12 };
const finale: React.CSSProperties = { textAlign: 'center', maxWidth: 520, margin: '8vh auto' };
const bloom: React.CSSProperties = { animation: 'ob-bloom 1.2s ease-out' };
