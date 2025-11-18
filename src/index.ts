import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import {
  FeedbackStorageAdapter,
  FileStorageAdapter
} from './storage';

// Re-export storage types for consumers
export type { FeedbackStorageAdapter, FeedbackStorageEntry } from './storage';
export { FileStorageAdapter } from './storage';

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
    storage = new FileStorageAdapter(
      process.env.ASTRO_COAUTHOR_FEEDBACK_PATH ?? '.astro-doc-feedback.json'
    ),
  } = options;
  
  globalThis.__ASTRO_COAUTHOR__ = { storage };

  return {
    name: 'astro-ai-coauthor',
    hooks: {
      'astro:config:setup': ({ command, injectScript, injectRoute, updateConfig }) => {
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
