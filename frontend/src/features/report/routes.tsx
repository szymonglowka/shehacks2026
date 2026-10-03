import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function ReportPage() {
  return <Placeholder title="Report" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/report', element: <ReportPage /> },
];
