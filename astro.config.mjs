import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://boswald.nl',
  integrations: [sitemap()],
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
