import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const PatternsPage = lazy(() => import('./pages/PatternsPage'));

export const routes: RouteObject[] = [
  { path: '/patterns', element: <Suspense fallback={null}><PatternsPage /></Suspense> },
];
