import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function CirclePublicPage() {
  return <Placeholder title="CirclePublic" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/c/:token', element: <CirclePublicPage />, handle: { public: true } },
];
