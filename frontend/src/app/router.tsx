import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from 'react-router-dom';
import { collectFeatureRoutes } from './route-registry';
import { Shell } from './layout';
import { getAccessToken } from '../api/token-storage';

function isPublicHandle(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    (handle as { public?: boolean }).public === true
  );
}

/** Redirects to /welcome when a guarded route is hit without a token. */
function Guard({ handle, children }: { handle?: unknown; children?: ReactNode }) {
  const location = useLocation();
  if (isPublicHandle(handle) || getAccessToken()) return <>{children}</>;
  return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
}

export function buildRouter() {
  const featureRoutes = collectFeatureRoutes();
  return createBrowserRouter([
    {
      element: <Shell />,
      children: [
        { path: '/', element: <Navigate to="/today" replace /> },
        ...featureRoutes.map((r) => ({
          ...r,
          element: (
            <Guard handle={(r as { handle?: unknown }).handle}>{r.element}</Guard>
          ),
        })),
        { path: '*', element: <Navigate to="/today" replace /> },
      ],
    },
  ]);
}

export function AppRouter() {
  const router = useMemo(buildRouter, []);
  return <RouterProvider router={router} />;
}
