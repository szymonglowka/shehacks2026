import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '../app/i18n';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): React.ReactNode {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders a calm fallback with a way back and a way to get help', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Coś poszło nie tak.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wróć do Dzisiaj' })).toHaveAttribute('href', '/today');
    expect(screen.getByRole('link', { name: 'Telefony wsparcia' })).toHaveAttribute(
      'href',
      '/help',
    );
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <p>fine</p>
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});
