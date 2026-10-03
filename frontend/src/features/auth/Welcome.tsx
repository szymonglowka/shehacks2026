import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '@/components/Brand';

/** Public welcome screen (SCREENS §3.1). */
export function WelcomePage() {
  const { t } = useTranslation('auth');
  return (
    <main className="min-h-[calc(100vh-84px)] bg-cream">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 min-[821px]:grid-cols-2 min-[821px]:items-center">
        <div>
          <Brand />
          <h1 className="mt-8 font-serif text-[clamp(38px,4vw,53px)] font-semibold leading-[1.06] tracking-[-1.2px]">
            {t('welcome_title')}
          </h1>
          <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-muted">
            {t('welcome_sub')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/register" className="inline-flex">
              <span className="inline-flex min-h-[46px] items-center rounded-[14px] bg-forest px-5 text-[13px] font-bold text-white hover:bg-forest-deep">
                {t('welcome_start')}
              </span>
            </Link>
            <Link to="/login" className="min-h-[44px] py-3 text-[13px] font-bold text-forest hover:underline underline-offset-4">
              {t('welcome_login')}
            </Link>
          </div>
          <p className="mt-10 text-[12px] text-muted">
            {t('welcome_crisis')}{' '}
            <Link to="/help" className="font-bold text-forest hover:underline underline-offset-4">
              {t('welcome_crisis_link')}
            </Link>
          </p>
        </div>
        <div
          aria-hidden="true"
          className="relative hidden min-h-[420px] overflow-hidden rounded-[28px] bg-forest min-[821px]:block"
        >
          <div className="otula-hero-art" style={{ transform: 'scale(1.6)', top: '60px', right: '40px' }}>
            <div className="otula-petal otula-petal-one" />
            <div className="otula-petal otula-petal-two" />
            <div className="otula-petal otula-petal-three" />
            <div className="otula-center-dot" />
          </div>
          <p className="absolute bottom-8 left-8 right-8 font-serif text-[24px] italic leading-snug text-white/90">
            {t('welcome_quote')}
          </p>
        </div>
      </div>
    </main>
  );
}
