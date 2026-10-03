import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

export const routes: RouteObject[] = [
  { path: '/onboarding', element: <Suspense fallback={null}><OnboardingPage /></Suspense> },
];
