import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@colanode/core', '@colanode/crdt'],
      }),
      viteStaticCopy({
        targets: [
          {
            src: 'assets/**/*',
            dest: 'assets',
          },
        ],
      }),
    ],
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
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@colanode/core', '@colanode/crdt'],
      }),
    ],
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
