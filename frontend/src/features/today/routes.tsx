import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const TodayPage = lazy(() => import('./pages/TodayPage'));

export const routes: RouteObject[] = [
  { path: '/today', element: <Suspense fallback={null}><TodayPage /></Suspense> },
];
