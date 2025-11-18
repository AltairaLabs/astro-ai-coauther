import { defineConfig } from 'astro/config';
import astroAICoauthor from '../dist/index.js';

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroAICoauthor({
      enableFeedbackWidget: true,
      feedbackStorePath: '.local-doc-feedback.json',
      enableMetadata: true,
    }),
  ],
});
