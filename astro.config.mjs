import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';
import minifyHtml from '@jcayzac/astro-minify-html';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [minifyHtml()],

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
