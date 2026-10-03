import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function ToughDayPage() {
  return <Placeholder title="ToughDay" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/tough-day', element: <ToughDayPage />, handle: { modal: true } },
];
