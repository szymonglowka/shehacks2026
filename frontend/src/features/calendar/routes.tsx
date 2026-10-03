import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const CalendarPage = lazy(() => import('./pages/CalendarPage'));

export const routes: RouteObject[] = [
  { path: '/calendar', element: <Suspense fallback={null}><CalendarPage /></Suspense> },
];
