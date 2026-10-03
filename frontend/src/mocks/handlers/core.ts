import type { RequestHandler } from 'msw';

// f-core owns auth + me handlers (Part B). Other domains belong to feature agents.
export const handlers: RequestHandler[] = [];
