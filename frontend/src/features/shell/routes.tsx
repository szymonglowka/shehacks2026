import type { RouteObject } from 'react-router-dom';
import { QuickAddPage } from '@/app/QuickAdd';

export const routes: RouteObject[] = [
  { path: '/quick-add', element: <QuickAddPage />, handle: { modal: true } },
];
