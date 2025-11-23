/**
 * Test for frontmatter loading bug
 * Replicates the issue where frontmatter isn't loading from .md files
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Frontmatter Loading Bug', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'frontmatter-bug-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should read frontmatter from .md file', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    const mdFile = path.join(tempDir, 'test.md');
    const content = `---
title: 'Test Page'
aiCoauthor:
  sourceContext:
    files:
      - src/test.ts
    folders:
      - src/utils
    confidence: 'high'
    lastUpdated: '2025-11-23T12:00:00.000Z'
---

# Test Content
`;
    await fs.writeFile(mdFile, content, 'utf-8');

    const result = await readSourceContext(mdFile);
    
    expect(result).not.toBeNull();
    expect(result?.files).toEqual(['src/test.ts']);
    expect(result?.folders).toEqual(['src/utils']);
  });

  it('should return null for .astro file that does not exist', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    const astroFile = path.join(tempDir, 'does-not-exist.astro');
    const result = await readSourceContext(astroFile);
    
    expect(result).toBeNull();
  });

  it('should check file existence before reading', async () => {
    // Simulate the endpoint logic
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    // Create only .md file
    const mdFile = path.join(tempDir, 'page.md');
    await fs.writeFile(mdFile, `---
title: 'Page'
aiCoauthor:
  sourceContext:
    files: ['index.ts']
    folders: []
---

Content
`, 'utf-8');

    // Try extensions in order: .astro, .mdx, .md
    const basePath = path.join(tempDir, 'page');
    const extensions = ['.astro', '.mdx', '.md'];
    
    let sourceContext = null;
    let foundFile = null;
    
    for (const ext of extensions) {
      const testPath = `${basePath}${ext}`;
      try {
        // Check if file exists
        await fs.access(testPath);
        // File exists, read it
        sourceContext = await readSourceContext(testPath);
        foundFile = testPath;
        break;
      } catch {
        // File doesn't exist, try next
        continue;
      }
    }

    expect(foundFile).toBe(mdFile);
    expect(sourceContext).not.toBeNull();
    expect(sourceContext?.files).toEqual(['index.ts']);
  });

  it('should not stop at first extension if file does not exist', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    // Create only .mdx file
    const mdxFile = path.join(tempDir, 'another-page.mdx');
    await fs.writeFile(mdxFile, `---
title: 'Another Page'
aiCoauthor:
  sourceContext:
    files: ['app.ts']
    folders: ['src']
---

Content
`, 'utf-8');

    // Simulate checking .astro first (doesn't exist), then .mdx (exists)
    const basePath = path.join(tempDir, 'another-page');
    const extensions = ['.astro', '.mdx', '.md'];
    
    let sourceContext = null;
    
    for (const ext of extensions) {
      const testPath = `${basePath}${ext}`;
      try {
        await fs.access(testPath);
        sourceContext = await readSourceContext(testPath);
        if (sourceContext !== null || ext === extensions[extensions.length - 1]) {
          break;
        }
      } catch {
        continue;
      }
    }

    expect(sourceContext).not.toBeNull();
    expect(sourceContext?.files).toEqual(['app.ts']);
    expect(sourceContext?.folders).toEqual(['src']);
  });
});
