// AUTO-REGISTRATION: every src/mocks/handlers/*.ts must export `handlers`.
import { setupWorker } from 'msw/browser';
import type { RequestHandler } from 'msw';

const modules = import.meta.glob<{ handlers: RequestHandler[] }>(
  './handlers/*.ts',
  { eager: true },
);

export const handlers: RequestHandler[] = Object.values(modules).flatMap(
  (mod) => mod.handlers ?? [],
);

export const worker = setupWorker(...handlers);

export async function startMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  if (typeof window === 'undefined') return;
  await worker.start({ onUnhandledRequest: 'bypass' });
}
