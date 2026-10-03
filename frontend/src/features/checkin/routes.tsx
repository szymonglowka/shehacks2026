import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const CheckinPage = lazy(() => import('./pages/CheckinPage'));

export const routes: RouteObject[] = [
  {
    path: '/checkin',
    handle: { modal: true },
    element: (
      <Suspense fallback={null}>
        <CheckinPage />
      </Suspense>
    ),
  },
];
