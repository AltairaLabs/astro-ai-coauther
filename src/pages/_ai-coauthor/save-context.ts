/**
 * Save Source Context API Endpoint
 * Saves detected source context to page frontmatter
 */

import type { APIRoute } from 'astro';
import { saveSourceContext } from '../../utils/source-context-detection';
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
    const { docPath, sourceContext } = body;
    
    if (!docPath || !sourceContext) {
      return new Response(
        JSON.stringify({ error: 'Missing docPath or sourceContext' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get project root from environment or use cwd
    const projectRoot = process.env.ASTRO_PROJECT_ROOT || process.cwd();
    
    // Map URL path to a relative file path for the documentation
    const urlPath = docPath.startsWith('/') ? docPath.slice(1) : docPath;
    
    // Assume docs are in src/pages or similar
    const docsRoot = process.env.DOCS_ROOT || 'src/pages';
    const docFilePath = path.resolve(projectRoot, docsRoot, `${urlPath}.astro`);
    
    // Save to frontmatter
    await saveSourceContext(docFilePath, sourceContext);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Source context saved to frontmatter',
        path: docFilePath
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    console.error('[ai-coauthor] Save error:', error);
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
      status: 'Source context save API is running',
      methods: ['POST'],
      endpoint: '/_ai-coauthor/save-context'
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};
