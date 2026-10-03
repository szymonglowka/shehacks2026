import { Bell, Heart, Moon, Plus } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Brand } from '../components/Brand';
import { useNightMode } from './useNightMode';
import { useMe } from '../api/me';
import { api } from '../api/client';
import { getAccessToken } from '../api/token-storage';

const NAV = [
  { to: '/today', key: 'today', icon: 'home' },
  { to: '/calendar', key: 'calendar', icon: 'calendar' },
  { to: '/patterns', key: 'patterns', icon: 'chart' },
  { to: '/goals', key: 'goals', icon: 'target' },
  { to: '/support', key: 'support', icon: 'heart' },
  { to: '/knowledge', key: 'knowledge', icon: 'book' },
] as const;

function NavIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  // lucide-react icons with the Figma stroke (1.8).
  // Kept local so the shell never depends on feature code.
  const props = { size, strokeWidth: 1.8 } as const;
  switch (icon) {
    case 'calendar':
      return <CalendarIcon {...props} />;
    case 'chart':
      return <ChartIcon {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'book':
      return <BookIcon {...props} />;
    case 'target':
      return <TargetIcon {...props} />;
    default:
      return <HomeIcon {...props} />;
  }
}

const svgProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}) as const;

function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5M9 21v-7h6v7" />
    </svg>
  );
}

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </svg>
  );
}

function ChartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />
    </svg>
  );
}

function BookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  );
}

function TargetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface NotificationItem {
  read_at: string | null;
}

function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-dot'],
    queryFn: () =>
      api<{ results: NotificationItem[] }>('/notifications').then((res) =>
        res.results.filter((n) => !n.read_at).length,
      ),
    enabled: getAccessToken() !== null,
    retry: false,
    staleTime: 60_000,
  });
  return data ?? 0;
}

function ToughDayButton({ compact }: { compact?: boolean }) {
  const { t } = useTranslation('shell');
  const location = useLocation();
  return (
    <Link
      to="/tough-day"
      state={{ background: location.pathname }}
      className={`flex items-center gap-2 font-semibold text-warm ${
        compact
          ? 'h-10 w-10 place-content-center rounded-full border border-line bg-paper'
          : 'rounded-full border border-line bg-paper px-[15px] py-2.5 text-[13px]'
      }`}
    >
      <Heart size={compact ? 20 : 17} strokeWidth={1.8} />
      {compact ? <span className="sr-only">{t('tough_day')}</span> : <span>{t('tough_day')}</span>}
    </Link>
  );
}

function Sidebar() {
  const { t } = useTranslation('shell');
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-[248px] flex-col border-r border-line bg-paper px-6 pb-6 pt-[38px] min-[821px]:flex">
      <Brand />
      <nav aria-label={t('main_nav')} className="mt-[54px] grid gap-[7px]">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex w-full items-center gap-[14px] rounded-[14px] px-[15px] py-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-sage font-semibold text-forest-deep'
                  : 'text-muted hover:bg-sage-light hover:text-forest'
              }`
            }
          >
            <NavIcon icon={item.icon} />
            <span>{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto grid gap-[18px]">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex w-full items-center gap-[14px] rounded-[14px] px-[15px] py-[13px] font-medium ${
              isActive ? 'bg-sage font-semibold text-forest-deep' : 'text-muted hover:bg-sage-light hover:text-forest'
            }`
          }
        >
          <span
            aria-hidden="true"
            className="grid h-6 w-6 place-items-center rounded-full bg-sage text-[10px] font-bold text-forest-deep"
          >
            ?
          </span>
          <span>{t('nav.profile')}</span>
        </NavLink>
        <div className="grid gap-2 rounded-2xl bg-cream p-[15px] text-[12px] text-muted">
          <span>{t('need_help')}</span>
          <Link to="/help" className="flex items-center gap-[7px] font-semibold text-forest">
            {t('support_phones')}
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { t, i18n } = useTranslation('shell');
  const { isNight, toggle } = useNightMode();
  const { data: me } = useMe();
  const unread = useUnreadCount();
  const date = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const name = me?.profile.display_name ?? '';

  return (
    <header className="sticky top-0 z-[5] flex h-[84px] items-center justify-between border-b border-line bg-cream/90 px-[4.5vw] backdrop-blur-xl">
      <div className="min-[821px]:hidden">
        <Brand compact />
      </div>
      <p className="hidden text-sm font-medium capitalize text-muted min-[821px]:block">{date}</p>
      <div className="flex items-center gap-3">
        <div className="hidden min-[621px]:block">
          <ToughDayButton />
        </div>
        <div className="min-[621px]:hidden">
          <ToughDayButton compact />
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={isNight}
          aria-label={t('night_toggle')}
          title={t('night_toggle')}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-sage-light"
        >
          <Moon size={20} strokeWidth={1.8} />
        </button>
        <Link
          to="/notifications"
          aria-label={t('notifications')}
          className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sage-light"
        >
          <Bell size={20} strokeWidth={1.8} />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-2 border-cream bg-peach"
            />
          )}
        </Link>
        {name ? (
          <Link
            to="/profile"
            aria-label={t('nav.profile')}
            className="grid h-[39px] w-[39px] place-items-center rounded-full bg-sage text-[12px] font-bold text-forest-deep"
          >
            {initials(name)}
          </Link>
        ) : (
          <Link to="/login" className="text-[13px] font-bold text-forest">
            {t('login')}
          </Link>
        )}
      </div>
    </header>
  );
}

function BottomNav() {
  const { t } = useTranslation('shell');
  const location = useLocation();
  const navigate = useNavigate();
  const items = [
    { to: '/today', key: 'today' },
    { to: '/calendar', key: 'calendar' },
    { to: '/goals', key: 'goals' },
    { to: '/support', key: 'support' },
  ];
  return (
    <nav
      aria-label={t('main_nav')}
      className="fixed inset-x-0 bottom-0 z-10 flex h-[70px] items-stretch justify-around border-t border-line bg-cream/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl min-[821px]:hidden"
    >
      {items.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex min-w-[64px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              isActive ? 'text-forest-deep' : 'text-muted'
            }`
          }
        >
          <NavIcon icon={item.key === 'today' ? 'home' : item.key} size={21} />
          <span>{t(`nav.${item.key}`)}</span>
        </NavLink>
      ))}
      <div className="flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => navigate('/quick-add', { state: { background: location.pathname } })}
          aria-label={t('quick_add_label')}
          className="grid h-[52px] w-[52px] place-items-center rounded-full bg-forest text-onforest shadow-card"
        >
          <Plus size={24} strokeWidth={1.8} />
        </button>
      </div>
      {items.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex min-w-[64px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              isActive ? 'text-forest-deep' : 'text-muted'
            }`
          }
        >
          <NavIcon icon={item.key} size={21} />
          <span>{t(`nav.${item.key}`)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Minimal public header for logged-out pages (welcome, login, register,
 * /help, /c/:token): logo + support lines, no sidebar/bottom nav, no
 * logged-in topbar actions — the page looks standalone (SCREENS §3.12).
 */
function PublicShell() {
  const { t } = useTranslation('shell');
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="flex h-[72px] items-center justify-between px-6 min-[821px]:px-10">
        <Link to="/welcome" aria-label="Otula">
          <Brand compact />
        </Link>
        <Link
          to="/help"
          className="inline-flex min-h-[44px] items-center text-[13px] font-bold text-forest hover:underline underline-offset-4"
        >
          {t('support_phones')}
        </Link>
      </header>
      <Outlet />
    </div>
  );
}

export function Shell() {
  useNightMode();
  if (getAccessToken() === null) return <PublicShell />;
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Sidebar />
      <div className="min-h-screen min-[821px]:ml-[248px]">
        <Topbar />
        <div className="pb-[90px] min-[821px]:pb-0">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
