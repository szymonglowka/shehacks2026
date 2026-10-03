import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function NotificationsPage() {
  return <Placeholder title="Notifications" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/notifications', element: <NotificationsPage /> },
];
