/**
 * Example: Configuring Logging Levels
 * 
 * The AI Coauthor integration uses Winston for logging and supports
 * multiple log levels to control verbosity.
 */

import { defineConfig } from 'astro/config';
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      // ... other options ...

      /**
       * Logging Configuration
       * 
       * Controls how much information is logged during detection operations.
       * Especially useful for debugging LLM-powered source context detection.
       */
      logging: {
        /**
         * Log Level Options:
         * - 'none': No logging (silent mode)
         * - 'error': Only errors
         * - 'warn': Warnings and errors
         * - 'info': General information + warn + error (default)
         * - 'debug': Detailed debug info including tool calls + all above
         */
        level: 'info',

        /**
         * Optional: Custom prefix for log messages
         * Default: 'ai-coauthor'
         */
        prefix: 'ai-coauthor',
      },

      // Example LLM configuration (logging helps debug this)
      llmProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        temperature: 0.1,
      },

      sourceRoot: './src',
      docsRoot: 'src/pages',
    }),
  ],
});

/**
 * RECOMMENDED LOG LEVELS BY ENVIRONMENT:
 * 
 * Development:
 *   level: 'debug' - See everything happening, including LLM tool calls
 * 
 * Production/CI:
 *   level: 'info' - Balance between visibility and noise
 * 
 * Batch Processing:
 *   level: 'info' - Track progress without overwhelming output
 * 
 * Silent Mode:
 *   level: 'none' - Disable all logging
 * 
 * 
 * WHAT GETS LOGGED AT EACH LEVEL:
 * 
 * 'debug':
 *   - Agent initialization details
 *   - Tool invocations with arguments
 *   - File reads and directory listings
 *   - Cache hits/misses
 *   - Token counts and timing
 *   - Job queue operations
 * 
 * 'info':
 *   - Batch detection start/complete
 *   - Individual page processing
 *   - Detection results (files found, confidence)
 *   - Job status updates
 *   - LLM provider selection
 * 
 * 'warn':
 *   - Missing jobs in queue
 *   - Deprecated API usage
 *   - Configuration issues
 * 
 * 'error':
 *   - Detection failures
 *   - Job processing errors
 *   - LLM API errors
 *   - File system errors
 * 
 * 
 * EXAMPLE LOG OUTPUT (level: 'debug'):
 * 
 * [ai-coauthor:detect-all] ▶ Starting batch detection request
 * [ai-coauthor:detect-all] → LLM provider: openai
 * [ai-coauthor:detect-all] → Found 25 documentation files
 * [ai-coauthor:job-queue] → Created job job_1234567890_abc123 for 25 pages
 * [ai-coauthor:detect-all:job_123] ▶ Background processing started for 25 files
 * [ai-coauthor:detect-all:job_123] → Processing (1/25): docs/api/overview.md
 * [ai-coauthor:llm-agentic] ▶ Starting detection for: docs/api/overview.md
 * [ai-coauthor:llm-agentic] → Using 5 allowed tools: list_source_files, read_file, ...
 * [ai-coauthor:tool:list_source_files] → Found 124 files
 * [ai-coauthor:tool:read_file] → Reading src/api/handlers.ts
 * [ai-coauthor:llm-agentic] ✓ Detection complete - Files: 3, Folders: 1, Confidence: high
 * [ai-coauthor:detect-all:job_123] ✓ docs/api/overview.md complete in 2340ms
 * ...
 * [ai-coauthor:job-queue] ✓ Job job_123 completed in 58s - 25 results
 */
