import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router-dom') || id.includes('react-dom') || /node_modules\/react\//.test(id)) return 'vendor-react';
          if (id.includes('socket.io')) return 'vendor-socket';
          return 'vendor';
        },
      },
    },
  }
})
