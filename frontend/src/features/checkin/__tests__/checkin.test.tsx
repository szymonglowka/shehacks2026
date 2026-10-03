import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CheckinPage from '../pages/CheckinPage';
import en from '../../checkin/locales/en.json';

const testI18n = i18n.createInstance();
void testI18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { checkin: en } },
  interpolation: { escapeValue: false },
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={['/checkin']}>
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={testI18n}>
          <CheckinPage />
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('check-in flow', () => {
  it('walks 4 steps and shows a red-flag alert with tel: actions', async () => {
    const user = userEvent.setup();
    renderPage();

    // Step 1: pick a mood, go next.
    await user.click(screen.getByRole('radio', { name: /mixed/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: go next.
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3 (body): tick a red flag → immediate alert with tel: link.
    const flag = screen.getByRole('button', { name: 'fever' });
    await user.click(flag);
    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    const tel = screen.getByRole('link', { name: /call 112/i });
    expect(tel.getAttribute('href')).toBe('tel:112');

    // Step 4 reachable.
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getAllByLabelText(/note/i).length).toBeGreaterThan(0);
  });

  it('requires a mood before continuing', async () => {
    userEvent.setup();
    renderPage();
    const next = screen.getByRole('button', { name: /continue/i });
    expect(next.hasAttribute('disabled')).toBe(true);
  });

  it('hides the voice dictation button when Web Speech API is unsupported', async () => {
    const user = userEvent.setup();
    renderPage();
    expect('SpeechRecognition' in window).toBe(false);
    await user.click(screen.getByRole('radio', { name: /mixed/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.queryByRole('button', { name: /dictate/i })).toBeNull();
  });
});
