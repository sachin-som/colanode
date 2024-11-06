import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/main': resolve('src/main'),
        '@/lib': resolve('src/lib'),
        '@/types': resolve('src/types'),
        '@/operations': resolve('src/operations'),
        '@/registry': resolve('src/registry'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/lib': resolve('src/lib'),
        '@/types': resolve('src/types'),
        '@/operations': resolve('src/operations'),
        '@/registry': resolve('src/registry'),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@/renderer': resolve('src/renderer'),
        '@/lib': resolve('src/lib'),
        '@/operations': resolve('src/operations'),
        '@/types': resolve('src/types'),
        '@/registry': resolve('src/registry'),
      },
    },
    plugins: [react()],
  },
});
