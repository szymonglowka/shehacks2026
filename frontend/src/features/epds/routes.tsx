import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const EpdsPage = lazy(() => import('./pages/EpdsPage'));

export const routes: RouteObject[] = [
  {
    path: '/epds',
    element: (
      <Suspense fallback={null}>
        <EpdsPage />
      </Suspense>
    ),
  },
];
