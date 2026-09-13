// Vite config — thêm proxy `/api/pricesapi` -> https://api.pricesapi.io
// để giải quyết vấn đề CORS và giấu Authorization header khỏi browser.
//
// Khi deploy production, route proxy này cần được handle bởi backend (Node/Python/etc).
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load .env (cả VITE_ prefix lẫn không prefix) để dùng cho server-side config
  const env = loadEnv(mode, process.cwd(), '')
  const PRICES_API_KEY = env.VITE_PRICES_API_KEY || env.PRICES_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/pricesapi': {
          target: 'https://api.pricesapi.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pricesapi/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (PRICES_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${PRICES_API_KEY}`)
              }
            })
          },
        },
      },
    },
  }
})