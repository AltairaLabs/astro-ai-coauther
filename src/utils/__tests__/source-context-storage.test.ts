import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveSourceContext, readSourceContext, supportsSourceContext } from '../source-context-storage';
import type { SourceContext } from '../../types';

// Mock frontmatter module
vi.mock('../frontmatter', () => ({
  updateSourceContext: vi.fn().mockResolvedValue(undefined),
  readSourceContext: vi.fn().mockResolvedValue({
    files: ['test.ts'],
    folders: [],
    globs: [],
    exclude: [],
    manual: false,
    confidence: 'high' as const,
    lastUpdated: new Date().toISOString(),
  }),
}));

// Mock astro-component-metadata module
vi.mock('../astro-component-metadata', () => {
  const mockSupportsFile = vi.fn((path: string) => path.endsWith('.astro'));
  const mockUpdateMetadata = vi.fn().mockResolvedValue(undefined);
  const mockExtractMetadata = vi.fn().mockResolvedValue({
    files: ['astro-test.ts'],
    folders: [],
    globs: [],
    exclude: [],
    manual: false,
    confidence: 'high' as const,
    lastUpdated: new Date().toISOString(),
  });

  return {
    AstroComponentMetadata: class {
      supportsFile = mockSupportsFile;
      updateMetadata = mockUpdateMetadata;
      extractMetadata = mockExtractMetadata;
    },
  };
});

describe('Source Context Storage', () => {
  const mockContext: SourceContext = {
    files: ['test.ts'],
    folders: [],
    globs: [],
    exclude: [],
    manual: true,
    confidence: 'high',
    lastUpdated: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSourceContext', () => {
    it('should save to frontmatter for .md files', async () => {
      const { updateSourceContext } = await import('../frontmatter');
      
      await saveSourceContext('docs/readme.md', mockContext);
      
      expect(updateSourceContext).toHaveBeenCalledWith(
        'docs/readme.md',
        mockContext,
        'aiCoauthor'
      );
    });

    it('should save to frontmatter for .mdx files', async () => {
      const { updateSourceContext } = await import('../frontmatter');
      
      await saveSourceContext('docs/api.mdx', mockContext, 'custom');
      
      expect(updateSourceContext).toHaveBeenCalledWith(
        'docs/api.mdx',
        mockContext,
        'custom'
      );
    });

    it('should save to JSDoc for .astro files', async () => {
      const { AstroComponentMetadata } = await import('../astro-component-metadata');
      const mockInstance = new AstroComponentMetadata();
      
      await saveSourceContext('components/Page.astro', mockContext);
      
      expect(mockInstance.updateMetadata).toHaveBeenCalledWith(
        'components/Page.astro',
        mockContext
      );
    });
  });

  describe('readSourceContext', () => {
    it('should read from frontmatter for .md files', async () => {
      const { readSourceContext: readFrontmatter } = await import('../frontmatter');
      
      const result = await readSourceContext('docs/readme.md');
      
      expect(readFrontmatter).toHaveBeenCalledWith('docs/readme.md', 'aiCoauthor');
      expect(result).toBeDefined();
      expect(result?.files).toContain('test.ts');
    });

    it('should read from frontmatter for .mdx files with custom namespace', async () => {
      const { readSourceContext: readFrontmatter } = await import('../frontmatter');
      
      const result = await readSourceContext('docs/api.mdx', 'customNS');
      
      expect(readFrontmatter).toHaveBeenCalledWith('docs/api.mdx', 'customNS');
      expect(result).toBeDefined();
    });

    it('should read from JSDoc for .astro files', async () => {
      const { AstroComponentMetadata } = await import('../astro-component-metadata');
      const mockInstance = new AstroComponentMetadata();
      
      const result = await readSourceContext('components/Page.astro');
      
      expect(mockInstance.extractMetadata).toHaveBeenCalledWith('components/Page.astro');
      expect(result).toBeDefined();
      expect(result?.files).toContain('astro-test.ts');
    });
  });

  describe('supportsSourceContext', () => {
    it('should return true for .md files', () => {
      expect(supportsSourceContext('docs/readme.md')).toBe(true);
    });

    it('should return true for .mdx files', () => {
      expect(supportsSourceContext('docs/api.mdx')).toBe(true);
    });

    it('should return true for .astro files', () => {
      expect(supportsSourceContext('components/Page.astro')).toBe(true);
    });

    it('should return true for uppercase extensions', () => {
      expect(supportsSourceContext('docs/README.MD')).toBe(true);
      expect(supportsSourceContext('docs/API.MDX')).toBe(true);
      expect(supportsSourceContext('components/Page.ASTRO')).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      expect(supportsSourceContext('package.json')).toBe(false);
      expect(supportsSourceContext('index.ts')).toBe(false);
      expect(supportsSourceContext('styles.css')).toBe(false);
    });

    it('should handle files without extensions', () => {
      expect(supportsSourceContext('README')).toBe(false);
    });
  });
});
