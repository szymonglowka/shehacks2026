import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { ApiError } from '@/api/client';
import { useRegister } from '@/api/auth';

const inputClass =
  'min-h-[46px] w-full rounded-[14px] border border-line bg-paper px-4 text-[15px] text-ink placeholder:text-muted/70';

/** Registration form with the health-data consent checkbox (SPEC §8). */
export function RegisterPage() {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const register = useRegister();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!consent) {
      setError(t('consent_required'));
      return;
    }
    try {
      await register.mutateAsync({
        email,
        password,
        display_name: displayName,
        language: i18n.language === 'en' ? 'en' : 'pl',
        health_data_consent: consent,
      });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('generic_error'));
    }
  };

  return (
    <main className="mx-auto w-full max-w-[440px] px-6 py-14">
      <Brand />
      <Eyebrow className="mt-10">{t('register_eyebrow')}</Eyebrow>
      <h1 className="mt-2 font-serif text-[34px] font-semibold">{t('register_title')}</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-[13px] font-semibold">
          {t('display_name')}
          <input
            type="text"
            required
            autoComplete="given-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold">
          {t('email')}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-[13px] font-semibold">
          {t('password')}
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-line bg-paper p-4 text-[13px] leading-relaxed">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-none accent-[#3f6959]"
          />
          <span>{t('health_consent')}</span>
        </label>
        {error && (
          <p role="alert" className="rounded-[14px] border border-[#b4533c] bg-[#b4533c]/10 px-4 py-3 text-[13px] font-semibold text-[#b4533c]">
            {error}
          </p>
        )}
        <Button type="submit" full disabled={register.isPending}>
          {register.isPending ? t('loading') : t('register_submit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted">
        {t('have_account')}{' '}
        <Link to="/login" className="font-bold text-forest hover:underline underline-offset-4">
          {t('login_submit')}
        </Link>
      </p>
    </main>
  );
}
