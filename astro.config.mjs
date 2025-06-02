import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

const excludedPaths = [
  '/en/newsletter/subscribed/',
  '/en/newsletter/unsubscribed/',
  '/nieuwsbrief/aangemeld/',
  '/nieuwsbrief/afgemeld/',
  '/handleiding/',
  '/tips/',
];

export default defineConfig({
  site: 'https://boswald.nl',
  output: 'server',
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) => {
        try {
          const path = new URL(page).pathname;
          return !excludedPaths.includes(path);
        } catch (e) {
          console.warn('Invalid page URL in sitemap:', page);
          return false;
        }
      },
      i18n: {
        defaultLocale: 'nl',
        locales: {
          en: 'en-GB',
        },
      },
    }),
  ],
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
