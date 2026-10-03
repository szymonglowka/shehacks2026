import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/600.css';
import './styles/tokens.css';
import './styles/tailwind.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Providers } from './app/providers';
import { startMocks } from './mocks/browser';

async function boot() {
  await startMocks();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Providers />
    </React.StrictMode>,
  );
}

void boot();
