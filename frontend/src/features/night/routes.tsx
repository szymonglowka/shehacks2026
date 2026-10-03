import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function NightPage() {
  return <Placeholder title="Night" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/night', element: <NightPage /> },
];
