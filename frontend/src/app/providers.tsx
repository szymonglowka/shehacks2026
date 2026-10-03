import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './i18n';
import { AppRouter } from './router';

export function Providers() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}
