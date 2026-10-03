import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function EPDSPage() {
  return <Placeholder title="EPDS" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/epds', element: <EPDSPage /> },
];
