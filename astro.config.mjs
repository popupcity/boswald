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
      filter: (page) => {
        try {
          const path = new URL(page).pathname;
          const excludedPaths = [
            '/en/newsletter/subscribed/',
            '/en/newsletter/unsubscribed/',
            '/nieuwsbrief/aangemeld/',
            '/nieuwsbrief/afgemeld/',
            '/handleiding/',
            '/tips/',
          ];
          return !excludedPaths.includes(path);
        } catch (e) {
          console.error('Sitemap filter error:', e);
          return false; // veiligheid: skip bij fout
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
