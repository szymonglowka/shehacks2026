import { CalendarHeart, CircleHelp, NotebookPen, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';

const ACTIONS = [
  { to: '/checkin', key: 'checkin', icon: NotebookPen, modal: true },
  { to: '/support', key: 'win', icon: Sparkles, modal: false },
  { to: '/report', key: 'question', icon: CircleHelp, modal: false },
  { to: '/calendar', key: 'period', icon: CalendarHeart, modal: false },
] as const;

/** Quick-add sheet behind the mobile [+] button (modal route /quick-add). */
export function QuickAddPage() {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as { background?: string };
  const close = () => navigate(state.background ?? '/today', { replace: true });

  return (
    <Modal title={t('quick_add_title')} eyebrow={t('quick_add_eyebrow')} onClose={close}>
      <div className="mt-6 grid gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.key}
            to={action.to}
            {...(action.modal ? { state: { background: state.background ?? '/today' } } : {})}
            replace={action.modal}
            className="flex min-h-[64px] items-center gap-4 rounded-[16px] border border-line bg-cream px-5 py-3 font-semibold transition-colors hover:border-forest"
          >
            <span className="grid h-[43px] w-[43px] flex-none place-items-center rounded-[14px] bg-sage text-forest">
              <action.icon size={22} strokeWidth={1.8} />
            </span>
            <span className="text-left">
              <span className="block text-[14px]">{t(`quick_add.${action.key}_title`)}</span>
              <span className="block text-[12px] font-medium text-muted">
                {t(`quick_add.${action.key}_hint`)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Modal>
  );
}
