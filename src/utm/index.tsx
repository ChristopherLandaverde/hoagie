import React from 'react';
import { createRoot } from 'react-dom/client';
import { UTMApp } from './UTMApp';
import '../styles/globals.css';

function renderApp() {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <UTMApp />
      </React.StrictMode>,
    );
  }
}

if (typeof Office !== 'undefined' && Office.onReady) {
  Office.onReady(() => renderApp());
} else {
  renderApp();
}
