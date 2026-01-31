import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '../styles/globals.css';

function renderApp() {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

// Office.onReady fires inside Excel; falls back to direct render in browser
if (typeof Office !== 'undefined' && Office.onReady) {
  Office.onReady(() => renderApp());
} else {
  renderApp();
}
