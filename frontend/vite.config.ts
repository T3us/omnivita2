import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiTarget = env.OMNIVITA_API_PROXY_TARGET || 'http://127.0.0.1:3001';
  const port = Number(env.OMNIVITA_FRONTEND_PORT || 5173);

  return {
    plugins: [react()],
    publicDir: 'public',
    server: {
      host: '0.0.0.0',
      port,
      strictPort: false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          ws: true
        }
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: false
    }
  };
});
