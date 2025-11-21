import { defineConfig } from 'astro/config';
import astroAICoauthor from '../dist/index.js';

// https://astro.build/config
export default defineConfig({
  integrations: [
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
      
      // Source code location
      sourceRoot: '../src',
      
      // Documentation location
      docsRoot: 'src/pages',
      
      // Logging configuration
      logging: {
        level: 'debug',  // 'none' | 'error' | 'warn' | 'info' | 'debug'
        prefix: 'ai-coauthor',
      },
    }),
  ],
});
