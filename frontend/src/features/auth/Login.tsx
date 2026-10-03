import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { ApiError } from '@/api/client';
import { useLogin } from '@/api/auth';

const inputClass =
  'min-h-[46px] w-full rounded-[14px] border border-line bg-paper px-4 text-[15px] text-ink placeholder:text-muted/70';

/** Login form (email + password). */
export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      navigate('/today', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('generic_error'));
    }
  };

  return (
    <main className="mx-auto w-full max-w-[440px] px-6 py-14">
      <Brand />
      <Eyebrow className="mt-10">{t('login_eyebrow')}</Eyebrow>
      <h1 className="mt-2 font-serif text-[34px] font-semibold">{t('login_title')}</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="danger-box">
            {error}
          </p>
        )}
        <Button type="submit" full disabled={login.isPending}>
          {login.isPending ? t('loading') : t('login_submit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted">
        {t('no_account')}{' '}
        <Link to="/register" className="font-bold text-forest hover:underline underline-offset-4">
          {t('welcome_start')}
        </Link>
      </p>
    </main>
  );
}
