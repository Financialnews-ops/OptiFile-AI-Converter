import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    // NOTE: We intentionally do NOT inject GEMINI_API_KEY into the client bundle
    // via `define`. This app uses a BYOK (bring-your-own-key) model — the user
    // supplies their key via the Settings drawer and it is stored in
    // localStorage/sessionStorage. Injecting a server env key here would bake it
    // into the public JS bundle, exposing it to anyone who views the page source.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
