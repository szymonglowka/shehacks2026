import type { RouteObject } from 'react-router-dom';

export interface OtulaRouteHandle {
  /** Reachable without a JWT (crisis + public circle + auth pages). */
  public?: boolean;
  /** Rendered as a modal/sheet over the background location. */
  modal?: boolean;
  /** Label key for navigation (feature components use their own nav). */
  nav?: string;
}

// AUTO-REGISTRATION: every src/features/*/routes.tsx must export
// `routes: RouteObject[]` (handles may carry OtulaRouteHandle).
const routeModules = import.meta.glob<{ routes: RouteObject[] }>(
  '../features/*/routes.tsx',
  { eager: true },
);

export function collectFeatureRoutes(): RouteObject[] {
  return Object.values(routeModules).flatMap((mod) => mod.routes ?? []);
}

export function isPublicRoute(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    (handle as OtulaRouteHandle).public === true
  );
}
