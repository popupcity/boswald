import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://boswald.nl',
  output: 'server',
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) =>
        page !== 'https://boswald.nl/en/newsletter/subscribed/' &&
        page !== 'https://boswald.nl/en/newsletter/unsubscribed/' &&
        page !== 'https://boswald.nl/nieuwsbrief/aangemeld/' &&
        page !== 'https://boswald.nl/nieuwsbrief/afgemeld/' &&
        page !== 'https://boswald.nl/handleiding/' &&
        page !== 'https://boswald.nl/tips/',
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
