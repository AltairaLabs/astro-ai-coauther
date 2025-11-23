/**
 * Tests for Astro Component Metadata Storage
 * Using JSDoc comments to store source context in .astro files
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type { SourceContext } from '../../types';

// Import will be created
import { AstroComponentMetadata } from '../astro-component-metadata';

describe('AstroComponentMetadata', () => {
  let tempDir: string;
  let metadata: AstroComponentMetadata;

  beforeEach(async () => {
    // Create temp directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-metadata-test-'));
    metadata = new AstroComponentMetadata();
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('extractMetadata', () => {
    it('should return null for file without JSDoc comment', async () => {
      const filePath = path.join(tempDir, 'simple.astro');
      const content = `---
const title = 'Test Page';
---
<html><body><h1>{title}</h1></body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const result = await metadata.extractMetadata(filePath);
      expect(result).toBeNull();
    });

    it('should extract metadata from valid JSDoc comment', async () => {
      const filePath = path.join(tempDir, 'with-metadata.astro');
      const content = `---
/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": ["src/index.ts", "src/types.ts"],
 *   "folders": ["src/"],
 *   "confidence": "high",
 *   "lastUpdated": "2025-11-23T10:00:00Z"
 * }
 */
const title = 'API Documentation';
---
<html><body><h1>{title}</h1></body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const result = await metadata.extractMetadata(filePath);
      
      expect(result).not.toBeNull();
      expect(result?.files).toEqual(['src/index.ts', 'src/types.ts']);
      expect(result?.folders).toEqual(['src/']);
      expect(result?.confidence).toBe('high');
    });

    it('should handle multi-line JSON in JSDoc', async () => {
      const filePath = path.join(tempDir, 'multiline.astro');
      const content = `---
/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": [
 *     "src/pages/api.ts",
 *     "src/utils/helpers.ts"
 *   ],
 *   "folders": ["src/pages", "src/utils"],
 *   "confidence": "medium",
 *   "lastUpdated": "2025-11-23T10:00:00Z"
 * }
 */
const { frontmatter } = Astro.props;
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const result = await metadata.extractMetadata(filePath);
      
      expect(result).not.toBeNull();
      expect(result?.files).toHaveLength(2);
      expect(result?.files).toContain('src/pages/api.ts');
    });

    it('should return null for malformed JSON in JSDoc', async () => {
      const filePath = path.join(tempDir, 'malformed.astro');
      const content = `---
/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": ["src/index.ts"
 *   // Missing closing brace
 */
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const result = await metadata.extractMetadata(filePath);
      expect(result).toBeNull();
    });

    it('should return null for file without component script', async () => {
      const filePath = path.join(tempDir, 'no-script.astro');
      const content = `<html><body><h1>Static Content</h1></body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const result = await metadata.extractMetadata(filePath);
      expect(result).toBeNull();
    });

    it('should ignore other JSDoc comments', async () => {
      const filePath = path.join(tempDir, 'other-jsdoc.astro');
      const content = `---
/**
 * Component description
 * @param {string} title - Page title
 */
const title = 'Test';

/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": ["src/component.ts"],
 *   "folders": [],
 *   "confidence": "high",
 *   "lastUpdated": "2025-11-23T10:00:00Z"
 * }
 */
const description = 'Description';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const result = await metadata.extractMetadata(filePath);
      
      expect(result).not.toBeNull();
      expect(result?.files).toEqual(['src/component.ts']);
    });
  });

  describe('updateMetadata', () => {
    it('should add JSDoc comment to file without existing metadata', async () => {
      const filePath = path.join(tempDir, 'new-metadata.astro');
      const originalContent = `---
const title = 'Test Page';
const description = 'Test description';
---
<html><body><h1>{title}</h1></body></html>`;
      
      await fs.writeFile(filePath, originalContent, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: ['src/test.ts'],
        folders: ['src/'],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, sourceContext);
      
      const updated = await fs.readFile(filePath, 'utf-8');
      
      expect(updated).toContain('@ai-coauthor');
      expect(updated).toContain('@sourceContext');
      expect(updated).toContain('"src/test.ts"'); // Multi-line format
      expect(updated).toContain('const title = \'Test Page\'');
      
      // Verify it still parses
      const extracted = await metadata.extractMetadata(filePath);
      expect(extracted?.files).toEqual(['src/test.ts']);
    });

    it('should update existing JSDoc comment', async () => {
      const filePath = path.join(tempDir, 'update-existing.astro');
      const originalContent = `---
/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": ["old/file.ts"],
 *   "folders": [],
 *   "confidence": "low",
 *   "lastUpdated": "2025-11-22T10:00:00Z"
 * }
 */
const title = 'Test Page';
---
<html><body><h1>{title}</h1></body></html>`;
      
      await fs.writeFile(filePath, originalContent, 'utf-8');
      
      const newContext: SourceContext = {
        files: ['new/file.ts', 'new/other.ts'],
        folders: ['new/'],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, newContext);
      
      const updated = await fs.readFile(filePath, 'utf-8');
      
      expect(updated).toContain('"new/file.ts"'); // Multi-line format
      expect(updated).toContain('"new/other.ts"');
      expect(updated).not.toContain('old/file.ts');
      expect(updated).toContain('const title = \'Test Page\'');
      
      const extracted = await metadata.extractMetadata(filePath);
      expect(extracted?.files).toEqual(['new/file.ts', 'new/other.ts']);
      expect(extracted?.confidence).toBe('high');
    });

    it('should preserve other JSDoc comments when updating', async () => {
      const filePath = path.join(tempDir, 'preserve-comments.astro');
      const originalContent = `---
/**
 * Component description
 * @param {string} title - Page title
 */
const myFunction = () => {};

/**
 * @ai-coauthor
 * @sourceContext
 * {
 *   "files": ["old.ts"],
 *   "folders": [],
 *   "confidence": "low",
 *   "lastUpdated": "2025-11-22T10:00:00Z"
 * }
 */
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, originalContent, 'utf-8');
      
      const newContext: SourceContext = {
        files: ['new.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, newContext);
      
      const updated = await fs.readFile(filePath, 'utf-8');
      
      // Original comment should be preserved
      expect(updated).toContain('Component description');
      expect(updated).toContain('@param {string} title');
      
      // Metadata should be updated
      expect(updated).toContain('"new.ts"'); // Multi-line format
      expect(updated).not.toContain('"old.ts"');
    });

    it('should use atomic write (temp file)', async () => {
      const filePath = path.join(tempDir, 'atomic-write.astro');
      const originalContent = `---
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, originalContent, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: ['test.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, sourceContext);
      
      // Temp file should not exist after successful write
      const tempFile = `${filePath}.tmp`;
      await expect(fs.access(tempFile)).rejects.toThrow();
      
      // Original file should be updated
      const updated = await fs.readFile(filePath, 'utf-8');
      expect(updated).toContain('@ai-coauthor');
    });

    it('should throw error for file without component script', async () => {
      const filePath = path.join(tempDir, 'no-script-update.astro');
      const content = `<html><body>Static</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: ['test.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await expect(
        metadata.updateMetadata(filePath, sourceContext)
      ).rejects.toThrow('No component script found');
    });

    it('should handle TypeScript syntax in component script', async () => {
      const filePath = path.join(tempDir, 'typescript.astro');
      const originalContent = `---
interface Props {
  title: string;
}

const { title }: Props = Astro.props;
const items: string[] = ['a', 'b', 'c'];
---
<html><body><h1>{title}</h1></body></html>`;
      
      await fs.writeFile(filePath, originalContent, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: ['src/types.ts'],
        folders: ['src/'],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, sourceContext);
      
      const updated = await fs.readFile(filePath, 'utf-8');
      
      // Should preserve TypeScript syntax
      expect(updated).toContain('interface Props');
      expect(updated).toContain('const items: string[]');
      expect(updated).toContain('@ai-coauthor');
      
      const extracted = await metadata.extractMetadata(filePath);
      expect(extracted?.files).toEqual(['src/types.ts']);
    });

    it('should clean up temp file on validation failure', async () => {
      const filePath = path.join(tempDir, 'invalid-update.astro');
      const originalContent = `---
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, originalContent, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: ['test.ts'],
        folders: [],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      // Update should succeed
      await metadata.updateMetadata(filePath, sourceContext);
      
      // Temp file should not exist after successful write
      const tempFile = `${filePath}.tmp`;
      await expect(fs.access(tempFile)).rejects.toThrow();
    });
  });

  describe('supportsFile', () => {
    it('should return true for .astro files', () => {
      expect(metadata.supportsFile('/path/to/file.astro')).toBe(true);
      expect(metadata.supportsFile('component.astro')).toBe(true);
      expect(metadata.supportsFile('/nested/path/page.astro')).toBe(true);
    });

    it('should return false for non-.astro files', () => {
      expect(metadata.supportsFile('/path/to/file.md')).toBe(false);
      expect(metadata.supportsFile('document.mdx')).toBe(false);
      expect(metadata.supportsFile('/path/to/script.ts')).toBe(false);
      expect(metadata.supportsFile('readme.txt')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(metadata.supportsFile('file.ASTRO')).toBe(true);
      expect(metadata.supportsFile('file.Astro')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files array', async () => {
      const filePath = path.join(tempDir, 'empty-files.astro');
      const content = `---
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: [],
        folders: ['src/'],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'low',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, sourceContext);
      
      const extracted = await metadata.extractMetadata(filePath);
      expect(extracted?.files).toEqual([]);
      expect(extracted?.folders).toEqual(['src/']);
    });

    it('should handle large metadata objects', async () => {
      const filePath = path.join(tempDir, 'large-metadata.astro');
      const content = `---
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const manyFiles = Array.from({ length: 50 }, (_, i) => `src/file${i}.ts`);
      
      const sourceContext: SourceContext = {
        files: manyFiles,
        folders: ['src/', 'src/utils/', 'src/pages/'],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'medium',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, sourceContext);
      
      const extracted = await metadata.extractMetadata(filePath);
      expect(extracted?.files).toHaveLength(50);
      expect(extracted?.files[0]).toBe('src/file0.ts');
    });

    it('should handle special characters in file paths', async () => {
      const filePath = path.join(tempDir, 'special-chars.astro');
      const content = `---
const title = 'Test';
---
<html><body>Content</body></html>`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      const sourceContext: SourceContext = {
        files: ['src/file-with-dash.ts', 'src/file_with_underscore.ts', 'src/@special/file.ts'],
        folders: ['src/@special/'],
        globs: [],
        exclude: [],
        manual: false,
        confidence: 'high',
        lastUpdated: '2025-11-23T10:00:00Z',
      };
      
      await metadata.updateMetadata(filePath, sourceContext);
      
      const extracted = await metadata.extractMetadata(filePath);
      expect(extracted?.files).toContain('src/@special/file.ts');
    });
  });
});
