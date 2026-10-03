import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function HelpPage() {
  return <Placeholder title="Help" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/help', element: <HelpPage />, handle: { public: true } },
];
