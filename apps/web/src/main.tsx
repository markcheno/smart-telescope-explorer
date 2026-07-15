import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { DesignProvider } from './state/store.js';
import './styles.css';

const container = document.getElementById('root');
if (container == null) throw new Error('Root element #root not found.');

createRoot(container).render(
  <StrictMode>
    <DesignProvider>
      <App />
    </DesignProvider>
  </StrictMode>,
);
