import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Mic, Phone } from 'lucide-react';
import { riskActionTarget, useCheckin, useUpsertCheckin, type CheckIn, type RiskResult } from '../../../api/tracking';
import { useAddVisitQuestion } from '../../../api/visit';

export const MOOD_COLORS = ['#c98b6b', '#dfb48f', '#e8d9b5', '#bcd3c2', '#7fa891'];

export const RED_FLAGS = [
  'heavy_bleeding',
  'fever',
  'severe_headache_vision',
  'chest_pain_breathing',
  'leg_swelling_pain',
  'wound_redness_discharge',
  'thoughts_of_harm',
];

const EMOTIONS = ['calm', 'tired', 'overwhelmed', 'grateful', 'lonely', 'irritable', 'tender', 'anxious'];
const SYMPTOMS = ['lack_of_sleep', 'back_pain', 'headache', 'breast_pain', 'anxiety_attack'];

const SYMPTOM_LABELS: Record<string, string> = {
  lack_of_sleep: 'symLackOfSleep',
  back_pain: 'symBackPain',
  headache: 'symHeadache',
  breast_pain: 'symBreastPain',
  anxiety_attack: 'symAnxietyAttack',
};

const RED_FLAG_LABELS: Record<string, string> = {
  heavy_bleeding: 'flagHeavyBleeding',
  fever: 'flagFever',
  severe_headache_vision: 'flagSevereHeadacheVision',
  chest_pain_breathing: 'flagChestPainBreathing',
  leg_swelling_pain: 'flagLegSwellingPain',
  wound_redness_discharge: 'flagWoundRednessDischarge',
  thoughts_of_harm: 'flagThoughtsOfHarm',
};

function todayISO() {
  // Local calendar day: toISOString() is UTC and stamps the wrong date
  // between 00:00 and 02:00 CEST.
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface CheckinDraft {
  mood: number | null;
  energy: number;
  anxiety: number;
  sleepHours: number;
  sleepQuality: number;
  pain: number;
  bleeding: string;
  symptoms: string[];
  redFlags: string[];
  emotions: string[];
  note: string;
}

/** Merge an existing check-in (edit mode) over blank defaults. Pure, unit-tested. */
export function draftFromCheckin(c: CheckIn | null | undefined): CheckinDraft | null {
  if (!c) return null;
  return {
    mood: c.mood,
    energy: c.energy ?? 3,
    anxiety: c.anxiety ?? 2,
    sleepHours: c.sleep_hours ?? 5,
    sleepQuality: c.sleep_quality ?? 3,
    pain: c.pain ?? 0,
    bleeding: c.bleeding ?? 'none',
    symptoms: c.symptoms ?? [],
    redFlags: c.red_flags ?? [],
    emotions: c.emotions ?? [],
    note: c.note ?? '',
  };
}

function useSpeechDictation(lang: string, onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const supported =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const toggle = () => {
    if (!supported) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = lang.startsWith('en') ? 'en-US' : 'pl-PL';
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript;
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };
  useEffect(() => () => recRef.current?.stop(), []);
  return { supported, listening, toggle };
}

function RiskCard({ risk }: { risk: RiskResult }) {
  const { t } = useTranslation('checkin');
  if (risk.level === 'none') return null;
  const urgent = risk.level === 'urgent';
  const primary = risk.actions[0];
  return (
    <div
      role="alert"
      style={{
        marginTop: 16, borderRadius: 16, padding: 16,
        background: urgent ? '#f8e8e2' : 'var(--sage-light, #f1f5f0)',
        border: urgent ? '2px solid #b4533c' : '1px solid var(--line, #e5e7df)',
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--ink, #25342f)' }}>
        {urgent ? t('riskDoctor') : t('riskLowDays')}
      </p>
      {urgent && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="tel:112" style={telBtn}>
            <Phone size={16} strokeWidth={1.8} /> {t('call112')}
          </a>
          <Link to="/help" style={helpBtn}>
            {t('riskHelp')}
          </Link>
        </div>
      )}
      {!urgent && primary && (
        <Link to={riskActionTarget(primary)} style={helpBtn}>
          {primary === 'suggest_epds' ? t('riskEpds') : t('riskOpenToolkit')}
        </Link>
      )}
    </div>
  );
}

export default function CheckinPage() {
  const { t, i18n } = useTranslation('checkin');
  const navigate = useNavigate();
  const upsert = useUpsertCheckin();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [anxiety, setAnxiety] = useState(2);
  const [sleepHours, setSleepHours] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [pain, setPain] = useState(0);
  const [bleeding, setBleeding] = useState('none');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saveAsQuestion, setSaveAsQuestion] = useState(false);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [saved, setSaved] = useState(false);
  const speech = useSpeechDictation(i18n.language, (text) =>
    setNote((n) => (n ? `${n} ${text}` : text)),
  );
  // Edit mode: prefill from today's existing check-in (404 → null → blank form).
  const date = todayISO();
  const { data: existing } = useCheckin(date);
  const prefilledRef = useRef(false);
  const addVisitQuestion = useAddVisitQuestion();
  useEffect(() => {
    if (prefilledRef.current) return;
    const draft = draftFromCheckin(existing);
    if (!draft) return;
    prefilledRef.current = true;
    setMood(draft.mood);
    setEnergy(draft.energy);
    setAnxiety(draft.anxiety);
    setSleepHours(draft.sleepHours);
    setSleepQuality(draft.sleepQuality);
    setPain(draft.pain);
    setBleeding(draft.bleeding);
    setSymptoms(draft.symptoms);
    setRedFlags(draft.redFlags);
    setEmotions(draft.emotions);
    setNote(draft.note);
  }, [existing]);

  const toggleIn = (list: string[], v: string, set: (l: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const close = () => navigate('/today');

  const save = () => {
    upsert.mutate(
      {
        date,
        mood, energy, anxiety,
        sleep_hours: sleepHours, sleep_quality: sleepQuality,
        pain, emotions, bleeding: bleeding as 'none',
        symptoms, red_flags: redFlags, note,
      },
      {
        onSuccess: ({ risk: r }) => {
          setRisk(r);
          setSaved(true);
          if (r.level === 'urgent' && r.actions.includes('show_crisis')) {
            navigate('/help');
            return;
          }
          if (saveAsQuestion && note.trim()) {
            addVisitQuestion.mutate(note.trim());
          }
        },
      },
    );
  };

  return (
    <div role="presentation" onMouseDown={close} style={backdrop}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
        onMouseDown={(e) => e.stopPropagation()}
        style={modal}
      >
        {saved ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={successIcon}>✓</div>
            <h2 id="checkin-title" style={h2}>{t('successTitle')}</h2>
            <p style={copy}>{t('successBody')}</p>
            {risk && <RiskCard risk={risk} />}
            <button type="button" onClick={close} style={primary}>
              {t('backToToday')}
            </button>
          </div>
        ) : (
          <>
            <p style={eyebrow}>{t('title')} · {t('stepOf', { step: step + 1 })}</p>

            {step === 0 && (
              <>
                <h2 id="checkin-title" style={h2}>{t('moodTitle')}</h2>
                <p style={copy}>{t('moodBody')}</p>
                <div role="radiogroup" aria-label={t('moodTitle')} style={moodGrid}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={mood === v}
                      onClick={() => setMood(v)}
                      style={{
                        ...moodTile,
                        background: mood === v ? MOOD_COLORS[v - 1] : 'var(--paper, #fffdf9)',
                        borderColor: mood === v ? MOOD_COLORS[v - 1] : 'var(--line, #e5e7df)',
                      }}
                    >
                      <span style={moodNum}>{v}</span>
                      <small style={moodLabel}>{t(`mood${v}`)}</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 id="checkin-title" style={h2}>{t('bodyTitle')}</h2>
                <Slider label={`${t('energy')}: ${energy}/5`} value={energy} min={1} max={5} set={setEnergy} ends={[t('energyLow'), t('energyHigh')]} />
                <Slider label={`${t('anxiety')}: ${anxiety}/5`} value={anxiety} min={1} max={5} set={setAnxiety} ends={[t('anxietyLow'), t('anxietyHigh')]} />
                <div style={row}>
                  <span style={lbl}>{t('sleep')}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" onClick={() => setSleepHours(Math.max(0, sleepHours - 0.5))} style={stepBtn} aria-label="-0.5">−</button>
                    <strong style={serif}>{sleepHours.toFixed(1)} h</strong>
                    <button type="button" onClick={() => setSleepHours(Math.min(24, sleepHours + 0.5))} style={stepBtn} aria-label="+0.5">+</button>
                  </div>
                </div>
                <div style={pills}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setSleepQuality(v)} style={sleepQuality === v ? pillOn : pill}>
                      {v}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 id="checkin-title" style={h2}>{t('bodyTitle')}</h2>
                <p style={lbl}>{t('pain')}: {pain}/10</p>
                <div style={painGrid}>
                  {Array.from({ length: 11 }, (_, v) => (
                    <button key={v} type="button" onClick={() => setPain(v)} aria-pressed={pain === v} style={pain === v ? pillOn : pillSm}>
                      {v}
                    </button>
                  ))}
                </div>
                <p style={lbl}>{t('bleeding')}</p>
                <div style={pills}>
                  {['none', 'spotting', 'light', 'medium', 'heavy'].map((b) => (
                    <button key={b} type="button" onClick={() => setBleeding(b)} aria-pressed={bleeding === b} style={bleeding === b ? pillOn : pill}>
                      {t(`bleeding${cap(b)}`)}
                    </button>
                  ))}
                </div>
                <p style={lbl}>{t('symptoms')}</p>
                <div style={pills}>
                  {SYMPTOMS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleIn(symptoms, s, setSymptoms)} aria-pressed={symptoms.includes(s)} style={symptoms.includes(s) ? pillOn : pill}>
                      {t(SYMPTOM_LABELS[s] ?? s)}
                    </button>
                  ))}
                </div>
                <h3 style={h3}>{t('redFlagsTitle')}</h3>
                <p style={copy}>{t('redFlagsBody')}</p>
                <div style={pills}>
                  {RED_FLAGS.map((f) => (
                    <button key={f} type="button" onClick={() => toggleIn(redFlags, f, setRedFlags)} aria-pressed={redFlags.includes(f)} style={redFlags.includes(f) ? flagOn : flagOff}>
                      {t(RED_FLAG_LABELS[f] ?? f)}
                    </button>
                  ))}
                </div>
                {redFlags.length > 0 && (
                  <div role="alert" style={flagAlert}>
                    <p style={{ margin: '0 0 10px', fontWeight: 600 }}>{t('redFlagsAlert')}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a href="tel:112" style={telBtn}><Phone size={16} strokeWidth={1.8} /> {t('call112')}</a>
                      <Link to="/help" style={helpBtn}>{t('riskHelp')}</Link>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h2 id="checkin-title" style={h2}>{t('emotionsTitle')}</h2>
                <p style={copy}>{t('emotionsBody')}</p>
                <div style={pills}>
                  {EMOTIONS.map((e) => (
                    <button key={e} type="button" onClick={() => toggleIn(emotions, e, setEmotions)} aria-pressed={emotions.includes(e)} style={emotions.includes(e) ? pillOn : pill}>
                      {t(`em${cap(e)}`)}
                    </button>
                  ))}
                </div>
                <label style={lbl} htmlFor="checkin-note">{t('noteLabel')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    id="checkin-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('notePlaceholder')}
                    rows={3}
                    style={textarea}
                  />
                  {speech.supported && (
                    <button type="button" onClick={speech.toggle} aria-pressed={speech.listening} aria-label={t('dictate')} title={t('dictate')} style={micBtn}>
                      <Mic size={20} strokeWidth={1.8} />
                    </button>
                  )}
                </div>
                {speech.listening && <p style={copy}>{t('listening')}</p>}
                <label style={checkRow}>
                  <input type="checkbox" checked={saveAsQuestion} onChange={(e) => setSaveAsQuestion(e.target.checked)} />
                  {t('saveAsQuestion')}
                </label>
              </>
            )}

            <div style={nav}>
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} style={ghost}>
                  <ArrowLeft size={18} strokeWidth={1.8} /> {t('back')}
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} disabled={step === 0 && mood == null} style={primary}>
                  {t('next')} <ArrowRight size={18} strokeWidth={1.8} />
                </button>
              ) : (
                <button type="button" onClick={save} disabled={mood == null || upsert.isPending} style={primary}>
                  {t('save')}
                </button>
              )}
            </div>
            <div style={dots} aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={i === step ? dotOn : dot} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Slider({ label, value, min, max, set, ends }: { label: string; value: number; min: number; max: number; set: (v: number) => void; ends: [string, string] }) {
  return (
    <div style={{ margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={lbl}>{label}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => set(Number(e.target.value))} style={{ width: '100%', minHeight: 44 }} aria-label={label} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <small style={muted}>{ends[0]}</small>
        <small style={muted}>{ends[1]}</small>
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: '#222d287a', backdropFilter: 'blur(5px)',
  display: 'grid', placeItems: 'center', padding: 16, zIndex: 50, overflowY: 'auto',
};
const modal: React.CSSProperties = {
  background: 'var(--paper, #fffdf9)', borderRadius: 28, padding: 28,
  maxWidth: 600, width: '100%', boxShadow: '0 30px 90px #192b2347', margin: 'auto',
};
const eyebrow: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
  color: 'var(--forest, #3f6959)', margin: '0 0 8px',
};
const h2: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 30, margin: '0 0 6px', color: 'var(--ink, #25342f)' };
const h3: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 22, margin: '20px 0 4px', color: 'var(--ink, #25342f)' };
const copy: React.CSSProperties = { fontSize: 14, color: 'var(--ink, #25342f)', margin: '0 0 12px' };
const muted: React.CSSProperties = { fontSize: 12, color: 'var(--muted, #718079)' };
const lbl: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--ink, #25342f)', margin: '14px 0 6px', display: 'block' };
const serif: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 24 };
const moodGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12 };
const moodTile: React.CSSProperties = {
  border: '1px solid', borderRadius: 16, padding: '14px 4px', cursor: 'pointer',
  display: 'grid', gap: 4, justifyItems: 'center', minHeight: 88,
};
const moodNum: React.CSSProperties = { fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 600 };
const moodLabel: React.CSSProperties = { fontSize: 11, textAlign: 'center' };
const pills: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const pill: React.CSSProperties = {
  minHeight: 44, padding: '0 16px', borderRadius: 999, border: '1px solid var(--line, #e5e7df)',
  background: 'var(--paper, #fffdf9)', fontSize: 14, cursor: 'pointer', color: 'var(--ink, #25342f)',
};
const pillSm: React.CSSProperties = { ...pill, minWidth: 44, padding: 0 };
const pillOn: React.CSSProperties = { ...pill, background: 'var(--forest, #3f6959)', borderColor: 'var(--forest, #3f6959)', color: 'var(--on-forest)', fontWeight: 600 };
const painGrid: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' };
const flagOff: React.CSSProperties = { ...pill, borderColor: '#e0c4b8' };
const flagOn: React.CSSProperties = { ...pillOn, background: '#b4533c', borderColor: '#b4533c' };
const flagAlert: React.CSSProperties = {
  marginTop: 12, border: '2px solid #b4533c', borderRadius: 16, padding: 14, background: '#f8e8e2',
};
const telBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 18px',
  background: '#b4533c', color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14,
};
const helpBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 18px',
  background: 'var(--paper, #fffdf9)', color: 'var(--ink, #25342f)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 12, fontWeight: 600, textDecoration: 'none', fontSize: 14,
};
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 };
const stepBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--line, #e5e7df)',
  background: 'var(--paper, #fffdf9)', fontSize: 20, cursor: 'pointer',
};
const textarea: React.CSSProperties = {
  flex: 1, borderRadius: 14, border: '1px solid var(--line, #e5e7df)', padding: 12,
  fontSize: 15, fontFamily: 'inherit', minHeight: 88,
};
const micBtn: React.CSSProperties = {
  width: 56, height: 56, minWidth: 56, borderRadius: '50%', border: '1px solid var(--line, #e5e7df)',
  background: 'var(--sage, #dfeae2)', color: 'var(--forest, #3f6959)', cursor: 'pointer',
};
const checkRow: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginTop: 12 };
const nav: React.CSSProperties = { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 };
const primary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 24px',
  background: 'var(--forest, #3f6959)', color: 'var(--on-forest)', border: 'none', borderRadius: 14,
  fontSize: 15, fontWeight: 600, cursor: 'pointer',
};
const ghost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 18px',
  background: 'none', border: 'none', color: 'var(--muted, #718079)', fontSize: 14, cursor: 'pointer',
};
const dots: React.CSSProperties = { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 };
const dot: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: 'var(--line, #e5e7df)' };
const dotOn: React.CSSProperties = { ...dot, background: 'var(--forest, #3f6959)', width: 24, borderRadius: 999 };
const successIcon: React.CSSProperties = {
  width: 64, height: 64, borderRadius: '50%', background: 'var(--sage, #dfeae2)',
  display: 'grid', placeItems: 'center', fontSize: 28, color: 'var(--forest, #3f6959)', margin: '0 auto 12px',
};
