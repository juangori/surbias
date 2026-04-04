// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'de', 'fr', 'pt'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
