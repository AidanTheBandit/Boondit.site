// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  // leave output as the default "static"; the Node adapter handles API routes
  site: "https://boondit.site",
  integrations: [mdx(), sitemap(), tailwind(), react()],

  markdown: {
    shikiConfig: {
      theme: "github-dark-high-contrast",
    },
  },

  adapter: node({
    mode: "standalone",
  }),
});