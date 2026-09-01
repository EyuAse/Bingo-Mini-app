import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/afromessage': {
        target: 'https://api.afromessage.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/afromessage/, '/api')
      }
    }
  }
});
