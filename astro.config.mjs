import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://ugo.zhidaola.top',
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
  adapter: vercel(),
  vite: {
    optimizeDeps: {
      entries: ['keystatic.config.js'],
    },
  },
  scopedStyleStrategy: 'where',
});
