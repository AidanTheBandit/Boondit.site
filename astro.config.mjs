// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";


// https://astro.build/config
export default defineConfig({
  site: "https://boondit.site",
  integrations: [mdx(), sitemap(), tailwind(), react()],

  markdown: {
    shikiConfig: {
      theme: "github-dark-high-contrast",
    },
  },

  // Use Vercel adapter: supports hybrid mode (mostly static + dynamic routes).
  // The firmware download API route requires server rendering.
  adapter: vercel({}),
  output: "hybrid",

});