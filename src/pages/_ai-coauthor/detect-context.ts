/**
 * Source Context Detection API Endpoint
 * Injected by the AI Coauthor integration
 */

import type { APIRoute } from 'astro';
import { detectSourceContext } from '../../utils/source-context-detection';
import * as path from 'node:path';

// Force this endpoint to be server-rendered, not prerendered
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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
    
    // Get project root from environment or use cwd
    const projectRoot = process.env.ASTRO_PROJECT_ROOT || process.cwd();
    
    // Map URL path to a relative file path for the documentation
    const urlPath = docPath.startsWith('/') ? docPath.slice(1) : docPath;
    
    // Assume docs are in src/pages or similar
    // The integration will need to configure this
    const docsRoot = process.env.DOCS_ROOT || 'src/pages';
    const docFilePath = path.join(docsRoot, `${urlPath}.astro`);
    
    // Source root defaults to src/
    const sourceRoot = path.resolve(projectRoot, process.env.SOURCE_ROOT || 'src');
    
    // Run detection
    const result = await detectSourceContext(
      docFilePath,
      docContent,
      projectRoot,
      {
        projectRoot: sourceRoot,
        excludePatterns: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/node_modules/**',
          '**/dist/**',
          '**/.astro/**',
        ],
      }
    );
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    console.error('[ai-coauthor] Detection error:', error);
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
