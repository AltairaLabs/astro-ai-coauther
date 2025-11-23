import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import type {
  FeedbackStorageAdapter,
} from './storage/FeedbackStorageAdapter.js';
import {
  FileStorageAdapter
} from './storage/FileStorageAdapter.js';
import type {
  OpenAIConfig,
  AnthropicConfig,
  LocalModelConfig,
} from './types/index.js';

// Re-export storage types for consumers
export type { FeedbackStorageAdapter, FeedbackStorageEntry } from './storage/FeedbackStorageAdapter.js';
export { FileStorageAdapter } from './storage/FileStorageAdapter.js';

// Re-export export utilities for consumers
export { 
  exportFeedback, 
  generateAnalytics, 
  generateTasks 
} from './utils/export.js';
export type { 
  ExportOptions, 
  AnalyticsData, 
  FeedbackTask 
} from './utils/export.js';

// Re-export source context types and utilities for consumers
export type {
  SourceContext,
  AICoauthorFrontmatter,
  ContextDetectionResult,
  SourceContextConfig,
  ContextMapping,
  FileTree,
  DocumentationPage,
  PageCluster,
  MatchRule,
  ConfidenceLevel,
} from './types/index.js';

export {
  detectSourceContext,
  detectAllSourceContexts,
  validateSourceContext,
  saveSourceContext,
  loadSourceContext,
  removeAllSourceContexts,
  defaultSourceContextConfig,
} from './utils/source-context-detection.js';

// Re-export LLM types and utilities for consumers
export type {
  LLMProviderType,
  LLMProviderConfig,
  OpenAIConfig,
  AnthropicConfig,
  LocalModelConfig,
  LLMProvider,
  LLMDetectionRequest,
  LLMDetectionResponse,
  LLMDetectionStats,
} from './types/index.js';

export {
  createLLMProvider,
  isLLMAvailable,
} from './utils/llm/provider-factory.js';

export { LLMCache } from './utils/llm/cache.js';

export type { DetectionJob, JobStatus } from './utils/llm/job-queue.js';
export { getJobQueue } from './utils/llm/job-queue.js';

export interface AstroAICoauthorOptions {
  /**
   * Enable the feedback widget in development mode
   * @default true
   */
  enableFeedbackWidget?: boolean;

  /**
   * Custom storage adapter for feedback data
   * @default FileStorageAdapter with '.astro-doc-feedback.json'
   */
  storage?: FeedbackStorageAdapter;

  /**
   * Enable metadata tracking for documentation pages
   * @default true
   */
  enableMetadata?: boolean;

  /**
   * Enable stale documentation detection
   * @default false
   */
  enableStaleDetection?: boolean;

  /**
   * LLM provider configuration for AI-powered source context detection
   * @default undefined (uses rule-based detection)
   */
  llmProvider?: OpenAIConfig | AnthropicConfig | LocalModelConfig;

  /**
   * Source code root directory for detection
   * @default './src'
   */
  sourceRoot?: string;

  /**
   * Documentation root directory
   * @default 'src/pages'
   */
  docsRoot?: string;

  /**
   * Logging configuration
   * @default { level: 'info', prefix: 'ai-coauthor' }
   */
  logging?: {
    level?: 'none' | 'error' | 'warn' | 'info' | 'debug';
    prefix?: string;
  };
}

/**
 * Astro AI Co-Author Integration
 * 
 * Provides developer-mode documentation review, metadata tracking,
 * feedback collection, and AI-assisted documentation maintenance.
 */
export default function astroAICoauthor(
  options: AstroAICoauthorOptions = {}
): AstroIntegration {
  const {
    enableFeedbackWidget = true,
    enableMetadata = true,
    enableStaleDetection = false,
    llmProvider,
    sourceRoot = './src',
    docsRoot = 'src/pages',
    storage = new FileStorageAdapter(
      process.env.ASTRO_COAUTHOR_FEEDBACK_PATH ?? '.astro-doc-feedback.json'
    ),
  } = options;
  
  globalThis.__ASTRO_COAUTHOR__ = { 
    storage,
    llmProvider,
    sourceRoot,
    docsRoot,
  };

  return {
    name: 'astro-ai-coauthor',
    hooks: {
      'astro:config:setup': ({ command, injectScript, injectRoute, updateConfig, logger }) => {
        // Store Astro's logger in global for use throughout the integration
        globalThis.__ASTRO_COAUTHOR__.logger = logger;
        
        // Check what methods the logger has
        logger.info('AI Coauthor integration initialized');
        if (typeof logger.debug === 'function') {
          logger.debug('Debug logging is available');
        } else {
          logger.info('Note: Astro logger does not support debug level - using info level for all logs');
        }
        // Inject feedback widget script in development mode
        if (command === 'dev' && enableFeedbackWidget) {
          const widgetPath = fileURLToPath(
            new URL('../src/client/feedback-widget.ts', import.meta.url)
          ).replace('/dist/', '/');
          
          // Inject inline script that loads the feedback widget
          injectScript('page', `
            if (import.meta.env.MODE === 'development') {
              import('${widgetPath}')
                .catch(err => console.error('[astro-ai-coauthor] Failed to load feedback widget:', err));
            }
          `);
        }

        // Inject API routes for feedback (dev mode only - requires server)
        if (command === 'dev' && enableFeedbackWidget) {
          // Feedback API endpoint using storage adapter
          injectRoute({
            pattern: '/_ai-coauthor/feedback',
            entrypoint: fileURLToPath(
              new URL('../dist/virtual/feedback-endpoint.js', import.meta.url)
            ),
          });
          
          // Dashboard route (primary)
          injectRoute({
            pattern: '/_ai-coauthor/dashboard',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/dashboard.astro', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Friendly alias used in playground/demo links
          injectRoute({
            pattern: '/FeedbackDashboard',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/dashboard.astro', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Export API endpoint
          injectRoute({
            pattern: '/_ai-coauthor/export',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/export.ts', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Source context detection API endpoint
          injectRoute({
            pattern: '/_ai-coauthor/detect-context',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/detect-context.ts', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Source context save API endpoint
          injectRoute({
            pattern: '/_ai-coauthor/save-context',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/save-context.ts', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Get frontmatter API endpoint
          injectRoute({
            pattern: '/_ai-coauthor/get-frontmatter',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/get-frontmatter.ts', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Batch source context detection API endpoint
          injectRoute({
            pattern: '/_ai-coauthor/detect-all-contexts',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/detect-all-contexts.ts', import.meta.url)
            ).replace('/dist/', '/'),
          });

          // Job status API endpoint
          injectRoute({
            pattern: '/_ai-coauthor/job-status',
            entrypoint: fileURLToPath(
              new URL('../src/pages/_ai-coauthor/job-status.ts', import.meta.url)
            ).replace('/dist/', '/'),
          });
          
          // Force output mode to hybrid so API routes work in dev
          updateConfig({
            output: 'hybrid',
          });
        }

        // Metadata tracking: Reserved for future implementation
        // Will track documentation metadata such as last updated, author, etc.
        if (enableMetadata) {
          // Placeholder for metadata tracking implementation
        }

        // Stale detection: Reserved for future implementation  
        // Will detect outdated documentation based on git commits
        if (enableStaleDetection) {
          // Placeholder for stale detection implementation
        }
      },

      'astro:build:done': async ({ dir: _dir, pages: _pages }) => {
        // Reserved for future: Generate documentation metadata report
        // Will analyze built pages and generate quality metrics
      },
    },
  };
}
