import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEpdsQuestions, useSubmitEpds } from '../../../api/tracking';

function PetalRow({ total, done }: { total: number; done: number }) {
  return (
    <div style={{ display: 'flex', gap: 6 }} role="progressbar" aria-valuenow={done} aria-valuemax={total} aria-label="progress">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <path
            d="M10 1.5C4 4 4.5 12 10 18.5 15.5 12 16 4 10 1.5Z"
            fill={i < done ? 'var(--forest, #3f6959)' : 'none'}
            stroke="var(--forest, #3f6959)"
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

export default function EpdsPage() {
  const { t } = useTranslation('epds');
  const navigate = useNavigate();
  const { data: questions, isLoading, isError } = useEpdsQuestions();
  const submit = useSubmitEpds();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ total: number; risk_level: string } | null>(null);

  if (isLoading) {
    return (
      <main style={page}>
        <p>…</p>
      </main>
    );
  }
  if (isError || !questions) {
    return (
      <main style={page}>
        <p>EPDS</p>
        <button type="button" onClick={() => window.location.reload()} style={primary}>
          ↻
        </button>
      </main>
    );
  }

  if (result) {
    const level = result.risk_level;
    return (
      <main style={page}>
        <div style={{ maxWidth: 560 }}>
          <p style={eyebrow}>{t('title')}</p>
          <h1 style={h1}>
            {level === 'low' && t('resultLow')}
            {level === 'moderate' && t('resultModerate')}
            {level === 'high' && t('resultHigh')}
            {level === 'urgent' && t('resultUrgent')}
          </h1>
          <p style={body}>
            {level === 'low' && t('resultLowBody')}
            {level === 'moderate' && t('resultModerateBody')}
            {level === 'high' && t('resultHighBody')}
            {level === 'urgent' && t('resultUrgentBody')}
          </p>
          <p style={score}>{t('scoreLabel', { score: result.total })}</p>
          {(level === 'urgent' || result.total >= 10) && (
            <Link to="/help" style={{ ...primary, textDecoration: 'none' }}>
              {t('goHelp')}
            </Link>
          )}
          {level === 'high' && (
            <Link to="/knowledge?tab=specialists" style={link}>
              {t('seeSpecialists')}
            </Link>
          )}
          {(level === 'moderate' || level === 'low') && (
            <Link to="/support" style={link}>
              {t('openSupport')}
            </Link>
          )}
          <p style={hint}>{t('retakeInfo')}</p>
          <button type="button" onClick={() => navigate('/today')} style={textBtn}>
            {t('backToToday')}
          </button>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main style={page}>
        <div style={{ maxWidth: 560 }}>
          <p style={eyebrow}>{t('title')}</p>
          <h1 style={h1}>{t('introTitle')}</h1>
          <p style={body}>{t('introBody')}</p>
          <button type="button" onClick={() => setStarted(true)} style={primary}>
            {t('introStart')} <ArrowRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      </main>
    );
  }

  const q = questions[index];
  const choose = (value: number) => {
    const next = [...answers, value];
    setAnswers(next);
    if (index + 1 >= questions.length) {
      submit.mutate(next, {
        onSuccess: ({ assessment, risk }) => {
          if (risk.level === 'urgent') {
            navigate('/help');
            return;
          }
          setResult({ total: assessment.total, risk_level: assessment.risk_level });
        },
      });
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <main style={page}>
      <div style={{ maxWidth: 620, width: '100%' }}>
        <PetalRow total={questions.length} done={index} />
        <p style={step}>{t('questionOf', { n: index + 1 })}</p>
        <h1 style={h1}>{q.text}</h1>
        <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
          {q.options.map((opt, i) => (
            <button key={i} type="button" onClick={() => choose(i)} style={option} disabled={submit.isPending}>
              {opt}
            </button>
          ))}
        </div>
        {index > 0 && (
          <button
            type="button"
            onClick={() => {
              setIndex(index - 1);
              setAnswers(answers.slice(0, -1));
            }}
            style={textBtn}
          >
            <ArrowLeft size={16} strokeWidth={1.8} /> {t('backToToday')}
          </button>
        )}
      </div>
    </main>
  );
}

const page: React.CSSProperties = { padding: '32px 20px 64px', maxWidth: 900, margin: '0 auto' };
const eyebrow: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
  color: 'var(--forest, #3f6959)', margin: '0 0 8px',
};
const h1: React.CSSProperties = {
  fontFamily: 'Newsreader, serif', fontSize: 'clamp(30px, 4vw, 44px)',
  lineHeight: 1.08, margin: '0 0 12px', color: 'var(--ink, #25342f)',
};
const body: React.CSSProperties = { fontSize: 15, lineHeight: 1.6, color: 'var(--ink, #25342f)' };
const step: React.CSSProperties = { fontSize: 12, color: 'var(--muted, #718079)', margin: '12px 0 0' };
const score: React.CSSProperties = { fontSize: 14, color: 'var(--muted, #718079)' };
const hint: React.CSSProperties = { fontSize: 12, fontStyle: 'italic', color: 'var(--muted, #718079)' };
const primary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46,
  background: 'var(--forest, #3f6959)', color: '#fff', border: 'none',
  borderRadius: 14, padding: '0 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16,
};
const option: React.CSSProperties = {
  textAlign: 'left', minHeight: 56, padding: '12px 18px', fontSize: 15,
  background: 'var(--paper, #fffdf9)', border: '1px solid var(--line, #e5e7df)',
  borderRadius: 16, cursor: 'pointer', color: 'var(--ink, #25342f)',
};
const link: React.CSSProperties = {
  display: 'inline-block', marginTop: 12, marginRight: 16,
  color: 'var(--forest, #3f6959)', fontWeight: 600, fontSize: 14,
};
const textBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--muted, #718079)',
  fontSize: 14, marginTop: 16, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 6,
};
