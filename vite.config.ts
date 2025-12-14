import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Shim process.env.API_KEY so the existing code works without modification
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      host: true, // Needed for Docker port mapping
      port: 3000
    }
  };
});