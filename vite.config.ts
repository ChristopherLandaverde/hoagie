/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';

function getHttpsConfig() {
  try {
    const certDir = path.resolve(os.homedir(), '.office-addin-dev-certs');
    const certFile = path.join(certDir, 'localhost.crt');
    const keyFile = path.join(certDir, 'localhost.key');

    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      return {
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),
      };
    }
  } catch {
    // Fall through to default
  }
  return true;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    https: getHttpsConfig(),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        taskpane: path.resolve(__dirname, 'src/taskpane/index.html'),
        utm: path.resolve(__dirname, 'src/utm/index.html'),
      },
    },
  },
});
