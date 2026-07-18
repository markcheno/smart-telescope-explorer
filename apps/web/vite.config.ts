import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/smart-telescope-explorer/',
  server: { port: 5173 },
});
