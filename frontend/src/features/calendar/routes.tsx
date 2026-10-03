import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function CalendarPage() {
  return <Placeholder title="Calendar" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/calendar', element: <CalendarPage /> },
];
