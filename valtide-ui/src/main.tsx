/**
 * File: src/main.tsx
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {startWebOtel} from './otel.ts';
import App from './App.tsx';
import './index.css';

// Start browser tracing before render; no-op unless VITE_OTEL endpoint is set.
startWebOtel();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
