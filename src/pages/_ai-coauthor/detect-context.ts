/**
 * Source Context Detection API Endpoint
 * Injected by the AI Coauthor integration
 */

import type { APIRoute } from 'astro';
import { detectSourceContext } from '../../utils/source-context-detection';
import * as path from 'node:path';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

// Force this endpoint to be server-rendered, not prerendered
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  logger.start('detect-context', 'Received detection request');
  try {
    const text = await request.text();
    
    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = JSON.parse(text);
    const { docPath, docContent } = body;
    
    if (!docPath || !docContent) {
      return new Response(
        JSON.stringify({ error: 'Missing docPath or docContent' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    logger.debug('detect-context', `Doc path: ${docPath}, content length: ${docContent.length}`);
    
    // Get configuration from global context (set by integration)
    const globalConfig = (globalThis as any).__ASTRO_COAUTHOR__;
    const projectRoot = process.env.ASTRO_PROJECT_ROOT || process.cwd();
    logger.debug('detect-context', `Project root: ${projectRoot}`);
    
    // Map URL path to a relative file path for the documentation
    const urlPath = docPath.startsWith('/') ? docPath.slice(1) : docPath;
    
    // Get docs root from config or environment
    const docsRoot = globalConfig?.docsRoot || process.env.DOCS_ROOT || 'src/pages';
    const docFilePath = path.join(docsRoot, `${urlPath}.astro`);
    
    // Get source root from config
    const sourceRoot = path.resolve(
      projectRoot, 
      globalConfig?.sourceRoot || process.env.SOURCE_ROOT || 'src'
    );
    
    // Get LLM provider config if available
    const llmProvider = globalConfig?.llmProvider;
    logger.info('detect-context', `LLM provider: ${llmProvider ? llmProvider.type : 'none (fallback)'}`);
    
    // Run detection with LLM if configured
    logger.info('detect-context', `Starting detection for ${docPath}`);
    const result = await detectSourceContext(
      docFilePath,
      docContent,
      projectRoot,
      {
        projectRoot: sourceRoot,
        llmProvider,
        excludePatterns: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/node_modules/**',
          '**/dist/**',
          '**/.astro/**',
        ],
      }
    );
    
    logger.success(
      'detect-context',
      `Detection complete - Files: ${result.sourceContext.files.length}, ` +
      `Folders: ${result.sourceContext.folders.length}, ` +
      `Confidence: ${result.confidence}`
    );
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    logger.error('detect-context', 'Detection error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ 
      status: 'Source context detection API is running',
      methods: ['POST'],
      endpoint: '/_ai-coauthor/detect-context'
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};
