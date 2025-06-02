import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://boswald.nl',
  output: 'server',
  adapter: netlify(),

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: ['nl', 'en'],
    defaultLocale: 'nl',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
