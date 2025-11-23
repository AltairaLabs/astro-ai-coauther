import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../pages/_ai-coauthor/save-context';

// Mock the source-context-detection module
vi.mock('../utils/source-context-detection', () => ({
  saveSourceContext: vi.fn().mockResolvedValue(undefined),
}));

// Mock node modules
vi.mock('node:path', () => ({
  default: {
    resolve: vi.fn((...args: string[]) => args.join('/')),
  },
  resolve: vi.fn((...args: string[]) => args.join('/')),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    access: vi.fn(),
  };
});

describe('Save Context Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASTRO_PROJECT_ROOT = '/test-project';
    process.env.DOCS_ROOT = 'src/pages';
  });

  describe('POST handler', () => {
    it('should return 500 for invalid JSON', async () => {
      const request = new Request('http://localhost:3000/_ai-coauthor/save-context', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Unexpected');
    });

    it('should save context successfully', async () => {
      const fs = await import('node:fs/promises');
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const request = new Request('http://localhost:3000/_ai-coauthor/save-context', {
        method: 'POST',
        body: JSON.stringify({
          docPath: '/test-page',
          sourceContext: {
            files: ['test.ts'],
            folders: [],
            globs: [],
            exclude: [],
            manual: true,
            confidence: 'high',
            lastUpdated: new Date().toISOString(),
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.path).toContain('test-page');
    });

    it('should return 404 when file not found', async () => {
      const fs = await import('node:fs/promises');
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const request = new Request('http://localhost:3000/_ai-coauthor/save-context', {
        method: 'POST',
        body: JSON.stringify({
          docPath: '/test-page',
          sourceContext: {
            files: ['test.ts'],
            folders: [],
            globs: [],
            exclude: [],
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Could not find documentation file');
    });

    it('should handle save errors', async () => {
      const fs = await import('node:fs/promises');
      const { saveSourceContext } = await import('../utils/source-context-detection');
      
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(saveSourceContext).mockRejectedValue(new Error('Permission denied'));

      const request = new Request('http://localhost:3000/_ai-coauthor/save-context', {
        method: 'POST',
        body: JSON.stringify({
          docPath: '/test-page',
          sourceContext: {
            files: ['test.ts'],
            folders: [],
            globs: [],
            exclude: [],
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Permission denied');
    });

    it('should return 400 for empty request body', async () => {
      const request = new Request('http://localhost:3000/_ai-coauthor/save-context', {
        method: 'POST',
        body: '',
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Empty request body');
    });

    it('should return 400 for missing docPath or sourceContext', async () => {
      const request = new Request('http://localhost:3000/_ai-coauthor/save-context', {
        method: 'POST',
        body: JSON.stringify({ docPath: '/test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing docPath or sourceContext');
    });
  });
});
