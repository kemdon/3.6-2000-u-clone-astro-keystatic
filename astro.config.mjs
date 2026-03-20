import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://www.birthdaycakecandle.com',
  output: 'server',
  server: {
    host: true,
    port: 4321,
  },
  preview: {
    host: true,
    port: 4321,
  },
  integrations: [react()],
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    optimizeDeps: {
      entries: ['keystatic.config.js'],
    },
  },
  scopedStyleStrategy: 'where',
});
