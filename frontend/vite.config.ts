import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          const dealHealthMatch = path.match(/^\/api\/ai\/deal-health\/([^/?]+)/);
          if (dealHealthMatch) {
            return `/api/ai/deal-health?deal_id=${dealHealthMatch[1]}`;
          }
          const objectionMatch = path.match(/^\/api\/ai\/objection-analysis\/([^/?]+)/);
          if (objectionMatch) {
            return `/api/ai/objection-analysis?deal_id=${objectionMatch[1]}`;
          }
          return path;
        },
      },
    },
  },
})
