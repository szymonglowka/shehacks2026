import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function ProfilePage() {
  return <Placeholder title="Profile" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/profile', element: <ProfilePage /> },
];
