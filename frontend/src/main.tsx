import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/600.css';
import './styles/tokens.css';
import './styles/tailwind.css';
import './styles/components.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Providers } from './app/providers';
import { startMocks } from './mocks/browser';

async function boot() {
  await startMocks();
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root element');
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Providers />
    </React.StrictMode>,
  );
}

void boot();
