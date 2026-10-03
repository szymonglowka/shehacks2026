import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function SupportPage() {
  return <Placeholder title="Support" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/support', element: <SupportPage /> },
];
