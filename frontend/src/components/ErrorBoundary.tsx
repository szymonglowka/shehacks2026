import { Component } from 'react';
import type { ReactNode } from 'react';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';
import { Brand } from './Brand';
import { Eyebrow } from './Eyebrow';

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level crash guard: a single broken screen shows a calm fallback
 * (never a blank page), with a way back and a way to get help.
 */
class RawErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Never log check-in contents or notes — only the error message.
    console.error('[otula] screen error:', error.message);
  }

  render(): ReactNode {
    const { t, children } = this.props;
    if (!this.state.error) return children;
    return (
      <main className="mx-auto grid min-h-screen max-w-xl place-items-center bg-cream px-6 py-16 text-center text-ink">
        <div>
          <div className="mx-auto mb-6 grid w-fit place-items-center text-forest">
            <Brand />
          </div>
          <Eyebrow>{t('shell:error_eyebrow', { defaultValue: 'Otula' })}</Eyebrow>
          <h1 className="mt-2 font-serif text-4xl font-semibold">
            {t('shell:error_title', { defaultValue: 'Coś poszło nie tak.' })}
          </h1>
          <p className="mx-auto mt-3 max-w-[380px] text-sm leading-relaxed text-muted">
            {t('shell:error_body', {
              defaultValue: 'Spróbuj wrócić do Dzisiaj. Twoje zapisane dane są bezpieczne.',
            })}
          </p>
          {/* plain <a>: this boundary can sit outside the Router, where <Link> itself throws */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/today"
              className="inline-flex min-h-[46px] items-center rounded-[14px] bg-forest px-5 text-[13px] font-bold text-onforest hover:bg-forest-deep"
            >
              {t('shell:error_today', { defaultValue: 'Wróć do Dzisiaj' })}
            </a>
            <a
              href="/help"
              className="inline-flex min-h-[44px] items-center text-[13px] font-bold text-forest hover:underline underline-offset-4"
            >
              {t('shell:error_help', { defaultValue: 'Telefony wsparcia' })}
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export const ErrorBoundary = withTranslation()(RawErrorBoundary);
