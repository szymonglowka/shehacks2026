import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function TodayPage() {
  return <Placeholder title="Today" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/today', element: <TodayPage /> },
];
