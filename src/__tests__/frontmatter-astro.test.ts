/**
 * Test frontmatter reading from .astro files with JSDoc comments
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { readDocumentationPage } from '../utils/frontmatter';

describe('Frontmatter - Astro files with JSDoc', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should read frontmatter from .astro file with JSDoc comment containing JSON', async () => {
    const astroFile = path.join(tempDir, 'demo.astro');
    const content = `---
/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": [],
 *   "folders": [],
 *   "confidence": "low",
 *   "lastUpdated": "2025-11-20T19:30:44.746Z"
 * }
 */
const title = 'Source Context Detection Demo';
const description = 'Test page for source context mapping feature';
---

<!DOCTYPE html>
<html>
<body>Test</body>
</html>`;

    await fs.writeFile(astroFile, content, 'utf-8');

    // This should NOT throw a YAML parsing error
    const result = await readDocumentationPage(astroFile);
    
    expect(result).toBeDefined();
    expect(result.content).toContain('<!DOCTYPE html>');
  });

  it('should read frontmatter from .astro file with YAML frontmatter', async () => {
    const astroFile = path.join(tempDir, 'with-yaml.astro');
    const content = `---
title: 'My Page'
description: 'Test page'
aiCoauthor:
  sourceContext:
    files:
      - index.ts
---

<!DOCTYPE html>
<html>
<body>Test</body>
</html>`;

    await fs.writeFile(astroFile, content, 'utf-8');

    const result = await readDocumentationPage(astroFile);
    
    expect(result).toBeDefined();
    expect(result.frontmatter.title).toBe('My Page');
    expect(result.frontmatter.aiCoauthor.sourceContext.files).toEqual(['index.ts']);
  });

  it('should read frontmatter from .astro file with YAML and JSDoc comment', async () => {
    const astroFile = path.join(tempDir, 'mixed.astro');
    const content = `---
title: 'Demo Page'
description: 'Test'
/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": ["app.ts"],
 *   "confidence": "high"
 * }
 */
---

<html>
<body>Content</body>
</html>`;

    await fs.writeFile(astroFile, content, 'utf-8');

    // Should parse the YAML part only, ignoring JSDoc
    const result = await readDocumentationPage(astroFile);
    
    expect(result).toBeDefined();
    expect(result.frontmatter.title).toBe('Demo Page');
    expect(result.frontmatter.description).toBe('Test');
  });
});
