import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function CheckInPage() {
  return <Placeholder title="CheckIn" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/checkin', element: <CheckInPage />, handle: { modal: true } },
];
