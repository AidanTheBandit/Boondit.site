import { defineConfig } from 'astro/config';

// static output, no framework integrations: the whole site is html + one canvas
export default defineConfig({
  site: 'https://boondit.com',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
  // old URLs from the previous build keep working
  redirects: {
    '/r1-create': '/tools/',
    '/r1-flash-utility': '/tools/',
    '/rabbit': '/projects/rabbit/',
  },
});
