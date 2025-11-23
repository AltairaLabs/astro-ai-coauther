/**
 * Test for get-frontmatter endpoint API logic
 * Tests the actual endpoint with all file types
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Simulate the endpoint logic
async function getFrontmatterEndpointLogic(
  docPath: string,
  projectRoot: string,
  docsRoot: string
): Promise<{ sourceContext: any; foundPath?: string }> {
  const urlPath = docPath.startsWith('/') ? docPath.slice(1) : docPath;
  const possibleExtensions = ['.astro', '.mdx', '.md'];
  
  let docFilePath: string | null = null;
  let sourceContext = null;
  
  // Import here to ensure we're using the compiled version
  const { readSourceContext } = await import('../utils/source-context-storage');
  
  // Try each extension until we find the file
  for (const ext of possibleExtensions) {
    const testPath = path.join(projectRoot, docsRoot, `${urlPath}${ext}`);
    
    try {
      // Check if file exists first
      await fs.access(testPath);
      
      // File exists, try to read source context
      sourceContext = await readSourceContext(testPath);
      docFilePath = testPath;
      break;
    } catch {
      // File doesn't exist or can't be read, try next extension
      continue;
    }
  }
  
  return { sourceContext, foundPath: docFilePath || undefined };
}

describe('Get Frontmatter Endpoint Logic', () => {
  let tempDir: string;
  const docsRoot = 'src/pages';

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'endpoint-test-'));
    await fs.mkdir(path.join(tempDir, docsRoot), { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should find and read .md file when .astro does not exist', async () => {
    const mdFile = path.join(tempDir, docsRoot, 'test-md.md');
    await fs.writeFile(mdFile, `---
title: 'Test MD'
aiCoauthor:
  sourceContext:
    files: ['test.ts']
    folders: []
---
Content`, 'utf-8');

    const result = await getFrontmatterEndpointLogic('/test-md', tempDir, docsRoot);
    
    expect(result.foundPath).toBe(mdFile);
    expect(result.sourceContext).not.toBeNull();
    expect(result.sourceContext?.files).toEqual(['test.ts']);
  });

  it('should find and read .mdx file when .astro and .md do not exist', async () => {
    const mdxFile = path.join(tempDir, docsRoot, 'test-mdx.mdx');
    await fs.writeFile(mdxFile, `---
title: 'Test MDX'
aiCoauthor:
  sourceContext:
    files: ['app.ts']
    folders: ['src']
---
Content`, 'utf-8');

    const result = await getFrontmatterEndpointLogic('/test-mdx', tempDir, docsRoot);
    
    expect(result.foundPath).toBe(mdxFile);
    expect(result.sourceContext).not.toBeNull();
    expect(result.sourceContext?.files).toEqual(['app.ts']);
    expect(result.sourceContext?.folders).toEqual(['src']);
  });

  it('should prefer .astro over .mdx and .md if it exists', async () => {
    // Create all three files
    const baseName = 'prefer-astro';
    await fs.writeFile(path.join(tempDir, docsRoot, `${baseName}.astro`), `---
const data = { title: 'Astro' };
---
<!-- Astro files don't support YAML frontmatter -->`, 'utf-8');
    
    await fs.writeFile(path.join(tempDir, docsRoot, `${baseName}.mdx`), `---
title: 'MDX'
aiCoauthor:
  sourceContext:
    files: ['mdx.ts']
---
Content`, 'utf-8');
    
    await fs.writeFile(path.join(tempDir, docsRoot, `${baseName}.md`), `---
title: 'MD'
aiCoauthor:
  sourceContext:
    files: ['md.ts']
---
Content`, 'utf-8');

    const result = await getFrontmatterEndpointLogic(`/${baseName}`, tempDir, docsRoot);
    
    // Should find .astro first but return null context (astro doesn't support YAML frontmatter)
    expect(result.foundPath).toContain('.astro');
    expect(result.sourceContext).toBeNull();
  });

  it('should prefer .mdx over .md if .astro does not exist', async () => {
    const baseName = 'prefer-mdx';
    await fs.writeFile(path.join(tempDir, docsRoot, `${baseName}.mdx`), `---
title: 'MDX'
aiCoauthor:
  sourceContext:
    files: ['mdx.ts']
---
Content`, 'utf-8');
    
    await fs.writeFile(path.join(tempDir, docsRoot, `${baseName}.md`), `---
title: 'MD'
aiCoauthor:
  sourceContext:
    files: ['md.ts']
---
Content`, 'utf-8');

    const result = await getFrontmatterEndpointLogic(`/${baseName}`, tempDir, docsRoot);
    
    expect(result.foundPath).toContain('.mdx');
    expect(result.sourceContext).not.toBeNull();
    expect(result.sourceContext?.files).toEqual(['mdx.ts']);
  });

  it('should return null context when no file exists', async () => {
    const result = await getFrontmatterEndpointLogic('/does-not-exist', tempDir, docsRoot);
    
    expect(result.foundPath).toBeUndefined();
    expect(result.sourceContext).toBeNull();
  });

  it('should return null context when file exists but has no aiCoauthor data', async () => {
    const mdFile = path.join(tempDir, docsRoot, 'no-context.md');
    await fs.writeFile(mdFile, `---
title: 'No Context'
description: 'Just a regular page'
---
Content`, 'utf-8');

    const result = await getFrontmatterEndpointLogic('/no-context', tempDir, docsRoot);
    
    expect(result.foundPath).toBe(mdFile);
    expect(result.sourceContext).toBeNull();
  });

  it('should handle nested paths correctly', async () => {
    await fs.mkdir(path.join(tempDir, docsRoot, 'nested', 'deep'), { recursive: true });
    const mdFile = path.join(tempDir, docsRoot, 'nested/deep/page.md');
    await fs.writeFile(mdFile, `---
title: 'Nested Page'
aiCoauthor:
  sourceContext:
    files: ['nested.ts']
    folders: []
---
Content`, 'utf-8');

    const result = await getFrontmatterEndpointLogic('/nested/deep/page', tempDir, docsRoot);
    
    expect(result.foundPath).toBe(mdFile);
    expect(result.sourceContext).not.toBeNull();
    expect(result.sourceContext?.files).toEqual(['nested.ts']);
  });
});
