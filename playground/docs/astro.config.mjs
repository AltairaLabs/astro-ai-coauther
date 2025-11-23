import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import astroAICoauthor from '../../dist/index.js';

// https://astro.build/config
export default defineConfig({
  integrations: [
    mdx(),
    astroAICoauthor({
      enableFeedbackWidget: true,
      feedbackStorePath: '.local-doc-feedback.json',
      enableMetadata: true,
      
      // LLM-powered source context detection
      llmProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',  // or 'gpt-3.5-turbo' for cheaper option
        temperature: 0.1,
        maxTokens: 4000,
        cacheResults: true,
        cacheTTL: 3600,  // 1 hour cache
      },
      
      // Source code location - points to the sample application
      sourceRoot: '../code/src',
      
      // Documentation location
      docsRoot: 'src/pages',
    }),
  ],
});
