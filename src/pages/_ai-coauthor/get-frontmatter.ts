/**
 * Get Frontmatter Endpoint
 * Returns the current frontmatter for a documentation page
 */

import type { APIRoute } from 'astro';
import { readSourceContext } from '../../utils/source-context-storage';
import * as path from 'node:path';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const docPath = url.searchParams.get('path');
    
    if (!docPath) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get configuration
    const globalConfig = globalThis.__ASTRO_COAUTHOR__;
    const projectRoot = process.env.ASTRO_PROJECT_ROOT || process.cwd();
    const docsRoot = globalConfig?.docsRoot || process.env.DOCS_ROOT || 'src/pages';
    
    // Map URL path to file path - try multiple extensions
    const urlPath = docPath.startsWith('/') ? docPath.slice(1) : docPath;
    const possibleExtensions = ['.astro', '.mdx', '.md'];
    
    let docFilePath: string | null = null;
    let sourceContext = null;
    
    // Try each extension until we find the file
    for (const ext of possibleExtensions) {
      const testPath = path.join(projectRoot, docsRoot, `${urlPath}${ext}`);
      logger.debug('get-frontmatter', `Trying path: ${testPath}`);
      
      try {
        // Check if file exists first
        const fs = await import('node:fs/promises');
        await fs.access(testPath);
        
        // File exists, try to read source context
        sourceContext = await readSourceContext(testPath);
        docFilePath = testPath;
        logger.debug('get-frontmatter', `Found file: ${testPath}, context: ${sourceContext ? 'present' : 'null'}`);
        break;
      } catch {
        // File doesn't exist or can't be read, try next extension
        continue;
      }
    }
    
    if (!docFilePath) {
      logger.warn('get-frontmatter', `No documentation file found for: ${urlPath}`);
    }
    
    return new Response(
      JSON.stringify({ sourceContext }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    logger.error('get-frontmatter', 'Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
