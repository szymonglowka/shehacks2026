import type { RouteObject } from 'react-router-dom';
import { Placeholder } from '@/components/Placeholder';

function KnowledgePage() {
  return <Placeholder title="Knowledge" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

function ArticlePage() {
  return <Placeholder title="Article" eyebrow="Otula" description="Placeholder — owner agent builds this screen." />;
}

export const routes: RouteObject[] = [
  { path: '/knowledge', element: <KnowledgePage /> },
  { path: '/knowledge/:slug', element: <ArticlePage /> },
];
