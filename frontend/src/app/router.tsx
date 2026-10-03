import { useMemo } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  matchPath,
  useLocation,
} from 'react-router-dom';
import { collectFeatureRoutes } from './route-registry';
import { Shell } from './layout';
import { useMe } from '../api/me';
import { getAccessToken } from '../api/token-storage';

function isPublicHandle(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    (handle as { public?: boolean }).public === true
  );
}

function isModalHandle(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    (handle as { modal?: boolean }).modal === true
  );
}

const AUTH_PATHS = new Set(['/welcome', '/login', '/register']);

/**
 * Route guards: no token → /welcome; token but onboarding not done →
 * /onboarding; finished onboarding on /onboarding → /today.
 */
export function Guard({ handle, children }: { handle?: unknown; children?: React.ReactNode }) {
  const location = useLocation();
  const token = getAccessToken();
  const { data: me, isLoading } = useMe();
  if (isPublicHandle(handle)) {
    // Logged-in users don't need the auth pages.
    if (token && AUTH_PATHS.has(location.pathname)) {
      return <Navigate to="/today" replace />;
    }
    return <>{children}</>;
  }
  if (!token) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }
  if (!isLoading && me) {
    if (!me.profile.onboarding_completed && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    if (me.profile.onboarding_completed && location.pathname === '/onboarding') {
      return <Navigate to="/today" replace />;
    }
  }
  return <>{children}</>;
}

function modalPatterns() {
  return collectFeatureRoutes()
    .filter((r) => isModalHandle((r as { handle?: unknown }).handle) && typeof r.path === 'string')
    .map((r) => r.path as string);
}

/**
 * Modal routes (handle.modal) render OVER a background location:
 * navigate with `state={{ background: location.pathname }}`. A direct
 * visit falls back to /today behind the modal.
 */
function AppRoutes() {
  const location = useLocation();
  const patterns = useMemo(modalPatterns, []);
  const featureRoutes = useMemo(collectFeatureRoutes, []);
  const isModal = patterns.some((p) => matchPath(p, location.pathname) !== null);
  const state = (location.state ?? {}) as { background?: string };
  const background = isModal ? (state.background ?? '/today') : undefined;

  const modalRoutes = featureRoutes.filter((r) =>
    isModalHandle((r as { handle?: unknown }).handle),
  );
  const pageRoutes = featureRoutes.filter(
    (r) => !isModalHandle((r as { handle?: unknown }).handle),
  );

  return (
    <>
      <Routes location={background ?? location}>
        <Route element={<Shell />}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          {pageRoutes.map((r) => (
            <Route
              key={String(r.path)}
              path={r.path ?? undefined}
              element={
                <Guard handle={(r as { handle?: unknown }).handle}>{r.element}</Guard>
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
      {isModal && (
        <Routes location={location}>
          {modalRoutes.map((r) => (
            <Route
              key={String(r.path)}
              path={r.path ?? undefined}
              element={
                <Guard handle={(r as { handle?: unknown }).handle}>{r.element}</Guard>
              }
            />
          ))}
        </Routes>
      )}
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
