// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import astroAICoauthor from 'astro-ai-coauthor';

// https://astro.build/config
export default defineConfig({
  site: 'https://coauthor.altairalabs.ai',
  base: '/astro-ai-coauther',
  integrations: [
    mdx(),
    sitemap(),
    astroAICoauthor({
      enableFeedbackWidget: true,
      enableMetadata: true,
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
