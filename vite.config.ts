import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://stables.donkey.bike',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DonkeyRepublic-PricingApp/1.0)'
        }
      }
    }
  }
});