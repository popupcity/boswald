import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: ['nl', 'en'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
