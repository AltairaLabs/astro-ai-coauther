// Example astro.config.mjs configuration with LLM-powered source context detection

import { defineConfig } from 'astro/config';
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      // Enable the feedback widget in development mode
      enableFeedbackWidget: true,
      
      // Enable metadata tracking
      enableMetadata: true,
      
      // Configure LLM for AI-powered source context detection
      llmProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',  // or 'gpt-3.5-turbo' for cheaper option
        temperature: 0.1,               // Low temp for consistent results
        maxTokens: 4000,                // Enough for agent interactions
        cacheResults: true,             // Cache to reduce costs
        cacheTTL: 3600,                 // Cache for 1 hour
      },
      
      // Where your source code lives (for detection)
      sourceRoot: './src',
      
      // Where your documentation lives
      docsRoot: 'src/pages',
      
      // Optional: Custom storage adapter
      // storage: new CustomStorageAdapter(),
    }),
  ],
});
