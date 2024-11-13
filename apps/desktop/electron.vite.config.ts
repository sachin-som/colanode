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
        '@/shared': resolve('src/shared'),
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
        '@/shared': resolve('src/shared'),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@/renderer': resolve('src/renderer'),
        '@/shared': resolve('src/shared'),
      },
    },
    plugins: [react()],
  },
});
