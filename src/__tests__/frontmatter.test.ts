/**
 * Tests for frontmatter utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  readDocumentationPage,
  readSourceContext,
  updateSourceContext,
  removeAICoauthorData,
} from '../utils/frontmatter';
import type { SourceContext } from '../types';

describe('Frontmatter Utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'frontmatter-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readDocumentationPage', () => {
    it('should read markdown file with frontmatter', async () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `---
title: Test Page
tags: [test, example]
---

# Test Content

This is a test.`;
      await fs.writeFile(testFile, content);

      const result = await readDocumentationPage(testFile);

      expect(result.title).toBe('Test Page');
      expect(result.content).toContain('# Test Content');
      expect(result.frontmatter.tags).toEqual(['test', 'example']);
    });

    it('should handle markdown without frontmatter', async () => {
      const testFile = path.join(tempDir, 'no-frontmatter.md');
      const content = `# Just Content\n\nNo frontmatter here.`;
      await fs.writeFile(testFile, content);

      const result = await readDocumentationPage(testFile);

      expect(result.title).toBe('Untitled');
      expect(result.content).toContain('# Just Content');
      expect(result.frontmatter).toEqual({});
    });

    it('should return Untitled when no title in frontmatter', async () => {
      const testFile = path.join(tempDir, 'h1-title.md');
      const content = `# Page Title from H1\n\nContent here.`;
      await fs.writeFile(testFile, content);

      const result = await readDocumentationPage(testFile);

      // Current implementation doesn't extract H1, just returns "Untitled"
      expect(result.title).toBe('Untitled');
      expect(result.content).toContain('# Page Title from H1');
    });

    it('should throw error for non-existent file', async () => {
      const testFile = path.join(tempDir, 'nonexistent.md');

      await expect(readDocumentationPage(testFile)).rejects.toThrow();
    });
  });

  describe('readSourceContext', () => {
    it('should read source context from frontmatter', async () => {
      const testFile = path.join(tempDir, 'with-context.md');
      const content = `---
title: Test
aiCoauthor:
  sourceContext:
    files: [src/test.ts, src/utils.ts]
    folders: [src/components]
    confidence: high
---

Content`;
      await fs.writeFile(testFile, content);

      const result = await readSourceContext(testFile, 'aiCoauthor');

      expect(result).not.toBeNull();
      expect(result!.files).toEqual(['src/test.ts', 'src/utils.ts']);
      expect(result!.folders).toEqual(['src/components']);
      expect(result!.confidence).toBe('high');
    });

    it('should return null when source context not found', async () => {
      const testFile = path.join(tempDir, 'no-context.md');
      const content = `---
title: Test
---

Content`;
      await fs.writeFile(testFile, content);

      const result = await readSourceContext(testFile, 'aiCoauthor');

      expect(result).toBeNull();
    });

    it('should handle custom namespace', async () => {
      const testFile = path.join(tempDir, 'custom-ns.md');
      const content = `---
title: Test
customNs:
  sourceContext:
    files: [custom.ts]
---

Content`;
      await fs.writeFile(testFile, content);

      const result = await readSourceContext(testFile, 'customNs');

      expect(result).not.toBeNull();
      expect(result!.files).toEqual(['custom.ts']);
    });
  });

  describe('updateSourceContext', () => {
    it('should add source context to existing frontmatter', async () => {
      const testFile = path.join(tempDir, 'update.md');
      const content = `---
title: Original Title
tags: [test]
---

Content`;
      await fs.writeFile(testFile, content);

      const sourceContext: SourceContext = {
        files: ['src/new.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'medium',
        lastUpdated: new Date().toISOString(),
      };

      await updateSourceContext(testFile, sourceContext, 'aiCoauthor');

      const result = await readSourceContext(testFile, 'aiCoauthor');
      expect(result).not.toBeNull();
      expect(result!.files).toEqual(['src/new.ts']);
      expect(result!.confidence).toBe('medium');

      // Verify original frontmatter preserved
      const page = await readDocumentationPage(testFile);
      expect(page.frontmatter.title).toBe('Original Title');
      expect(page.frontmatter.tags).toEqual(['test']);

      // Verify string values are quoted in YAML for Astro compatibility
      const fileContent = await fs.readFile(testFile, 'utf-8');
      expect(fileContent).toMatch(/title: ['"]Original Title['"]/);
      expect(fileContent).toMatch(/confidence: ['"]medium['"]/);
      expect(fileContent).toMatch(/manual: false/); // booleans should NOT be quoted
    });

    it('should create frontmatter if none exists', async () => {
      const testFile = path.join(tempDir, 'no-fm.md');
      const content = `# Just Content\n\nNo frontmatter.`;
      await fs.writeFile(testFile, content);

      const sourceContext: SourceContext = {
        files: ['src/test.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: new Date().toISOString(),
      };

      await updateSourceContext(testFile, sourceContext, 'aiCoauthor');

      const result = await readSourceContext(testFile, 'aiCoauthor');
      expect(result).not.toBeNull();
      expect(result!.files).toEqual(['src/test.ts']);

      // Verify content preserved
      const page = await readDocumentationPage(testFile);
      expect(page.content).toContain('# Just Content');
    });

    it('should update existing source context', async () => {
      const testFile = path.join(tempDir, 'existing.md');
      const content = `---
aiCoauthor:
  sourceContext:
    files: [old.ts]
    confidence: low
---

Content`;
      await fs.writeFile(testFile, content);

      const sourceContext: SourceContext = {
        files: ['new.ts', 'another.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: true,
        confidence: 'high',
        lastUpdated: new Date().toISOString(),
      };

      await updateSourceContext(testFile, sourceContext, 'aiCoauthor');

      const result = await readSourceContext(testFile, 'aiCoauthor');
      expect(result!.files).toEqual(['new.ts', 'another.ts']);
      expect(result!.manual).toBe(true);
      expect(result!.confidence).toBe('high');
    });
  });

  describe('removeAICoauthorData', () => {
    it('should remove AI Coauthor data from frontmatter', async () => {
      const testFile = path.join(tempDir, 'remove.md');
      const content = `---
title: Test
aiCoauthor:
  sourceContext:
    files: [test.ts]
otherData: keep this
---

Content`;
      await fs.writeFile(testFile, content);

      await removeAICoauthorData(testFile, 'aiCoauthor');

      const page = await readDocumentationPage(testFile);
      expect(page.frontmatter.aiCoauthor).toBeUndefined();
      expect(page.frontmatter.title).toBe('Test');
      expect(page.frontmatter.otherData).toBe('keep this');
    });

    it('should handle file without AI Coauthor data', async () => {
      const testFile = path.join(tempDir, 'no-data.md');
      const content = `---
title: Test
---

Content`;
      await fs.writeFile(testFile, content);

      await expect(removeAICoauthorData(testFile, 'aiCoauthor')).resolves.not.toThrow();

      const page = await readDocumentationPage(testFile);
      expect(page.frontmatter.title).toBe('Test');
    });

    it('should handle file without frontmatter', async () => {
      const testFile = path.join(tempDir, 'no-fm.md');
      const content = `# Just Content`;
      await fs.writeFile(testFile, content);

      await expect(removeAICoauthorData(testFile, 'aiCoauthor')).resolves.not.toThrow();
    });
  });
});
