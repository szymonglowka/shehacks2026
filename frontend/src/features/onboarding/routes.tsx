import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function OnboardingPage() {
  return <Placeholder title="Onboarding" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/onboarding', element: <OnboardingPage /> },
];
