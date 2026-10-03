import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import './i18n';
import { Shell } from './layout';

function renderShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  localStorage.removeItem('otula:access');
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/help']}>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/help" element={<p>help body</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Shell for logged-out visitors', () => {
  it('shows a minimal public header without app navigation', () => {
    renderShell();
    expect(screen.getByText('help body')).toBeInTheDocument();
    // Public header: logo + support lines.
    expect(screen.getByRole('link', { name: 'Telefony wsparcia' })).toHaveAttribute(
      'href',
      '/help',
    );
    // No app chrome: no sidebar nav, no bottom nav, no tough-day pill.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Gorszy dzień')).not.toBeInTheDocument();
  });
});
