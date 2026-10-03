import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function PatternsPage() {
  return <Placeholder title="Patterns" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/patterns', element: <PatternsPage /> },
];
