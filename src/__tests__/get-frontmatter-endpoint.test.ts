/**
 * Tests for get-frontmatter endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Get Frontmatter Endpoint', () => {
  let tempDir: string;
  let testMdxFile: string;

  beforeAll(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'frontmatter-test-'));
    testMdxFile = path.join(tempDir, 'test.mdx');

    // Create test MDX file with frontmatter
    const content = `---
title: 'Test Page'
aiCoauthor:
  sourceContext:
    files:
      - src/index.ts
      - src/utils/helper.ts
    folders:
      - src/components
    confidence: 'high'
    lastUpdated: '2025-11-23T14:00:00.000Z'
---

# Test Content
`;
    await fs.writeFile(testMdxFile, content, 'utf-8');
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should read source context from MDX file', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    const result = await readSourceContext(testMdxFile);
    
    expect(result).not.toBeNull();
    expect(result?.files).toEqual(['src/index.ts', 'src/utils/helper.ts']);
    expect(result?.folders).toEqual(['src/components']);
    expect(result?.confidence).toBe('high');
  });

  it('should return null for file without source context', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    const noContextFile = path.join(tempDir, 'no-context.mdx');
    await fs.writeFile(noContextFile, `---
title: 'No Context'
---

# Content
`, 'utf-8');
    
    const result = await readSourceContext(noContextFile);
    
    expect(result).toBeNull();
  });

  it('should return null for non-existent file', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    const result = await readSourceContext(path.join(tempDir, 'does-not-exist.mdx'));
    
    expect(result).toBeNull();
  });

  it('should handle file with malformed frontmatter', async () => {
    const { readSourceContext } = await import('../utils/source-context-storage');
    
    const malformedFile = path.join(tempDir, 'malformed.mdx');
    await fs.writeFile(malformedFile, `---
title: 'Malformed
aiCoauthor: not properly closed
---

# Content
`, 'utf-8');
    
    // Should not throw, just return null
    const result = await readSourceContext(malformedFile);
    expect(result).toBeNull();
  });
});
