/**
 * Integration test for get-frontmatter endpoint
 * Tests the ACTUAL endpoint function with REAL playground files
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Import the actual endpoint handler
import { GET } from '../pages/_ai-coauthor/get-frontmatter';

describe('Get Frontmatter Endpoint - Real Files', () => {
  const playgroundRoot = path.join(process.cwd(), 'playground/docs');
  const docsRoot = 'src/pages';

  beforeAll(() => {
    // Set up global config to match playground
    (globalThis as any).__ASTRO_COAUTHOR__ = {
      docsRoot,
    };
    process.env.ASTRO_PROJECT_ROOT = playgroundRoot;
  });

  afterAll(() => {
    delete (globalThis as any).__ASTRO_COAUTHOR__;
    delete process.env.ASTRO_PROJECT_ROOT;
  });

  it('should load frontmatter from actual playground tutorial.md file', async () => {
    const tutorialPath = path.join(playgroundRoot, docsRoot, 'tutorial.md');
    console.log('\n=== Testing tutorial.md ===');
    console.log('File path:', tutorialPath);
    
    // Read file content directly - combines existence check and read to avoid TOCTOU race
    let content: string;
    try {
      content = await fs.readFile(tutorialPath, 'utf-8');
      console.log('File exists: true');
    } catch (error: any) {
      throw new Error(`Tutorial file does not exist at ${tutorialPath}: ${error.message}`);
    }
    console.log('File preview:', content.substring(0, 300));

    // Create mock request - THIS IS THE ACTUAL ENDPOINT CALL
    const url = new URL('http://localhost/_ai-coauthor/get-frontmatter?path=/tutorial');
    const request = new Request(url);
    
    // Call the REAL endpoint function
    const response = await GET({ request } as any);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('=========================\n');
    
    expect(response.status).toBe(200);
    
    if (data.sourceContext === null) {
      throw new Error('BUG FOUND: sourceContext is null but tutorial.md has aiCoauthor frontmatter!');
    }
    
    expect(data.sourceContext).toHaveProperty('files');
    expect(data.sourceContext).toHaveProperty('folders');
  });

  it('should load frontmatter from actual playground api-reference.mdx file', async () => {
    const apiRefPath = path.join(playgroundRoot, docsRoot, 'api-reference.mdx');
    console.log('\n=== Testing api-reference.mdx ===');
    console.log('File path:', apiRefPath);
    
    const exists = await fs.access(apiRefPath).then(() => true).catch(() => false);
    console.log('File exists:', exists);
    
    if (!exists) {
      console.log('Skipping - api-reference.mdx not found');
      return;
    }

    const url = new URL('http://localhost/_ai-coauthor/get-frontmatter?path=/api-reference');
    const request = new Request(url);
    
    const response = await GET({ request } as any);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('=========================\n');
    
    expect(response.status).toBe(200);
    expect(data.sourceContext).not.toBeNull();
  });
});
