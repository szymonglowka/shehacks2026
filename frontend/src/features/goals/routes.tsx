import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function GoalsPage() {
  return <Placeholder title="Goals" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/goals', element: <GoalsPage /> },
];
