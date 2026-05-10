import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            id.includes('@react-three/drei') ||
            id.includes('@react-three/fiber') ||
            id.includes('three-stdlib') ||
            id.includes('three/examples') ||
            id.includes('/three/')
          ) {
            return 'three-vendor'
          }

          if (
            id.includes('@mui/') ||
            id.includes('@emotion/')
          ) {
            return 'mui-vendor'
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor'
          }

          if (id.includes('/zod/')) {
            return 'zod-vendor'
          }

          if (id.includes('/zustand/')) {
            return 'state-vendor'
          }

          if (id.includes('dxf-parser')) {
            return 'dxf-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
