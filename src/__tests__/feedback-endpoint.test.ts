import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../virtual/feedback-endpoint';

describe('Feedback Endpoint', () => {
  beforeEach(() => {
    // Mock the global storage
    globalThis.__ASTRO_COAUTHOR__ = {
      storage: {
        save: vi.fn(),
        loadAll: vi.fn(),
      },
    };
  });

  describe('POST handler', () => {
    it('should save valid feedback with all fields', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          page: '/test-page',
          rating: 5,
          notes: 'Great documentation!',
          category: 'accuracy',
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(globalThis.__ASTRO_COAUTHOR__.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          page: '/test-page',
          rating: 5,
          notes: 'Great documentation!',
          category: 'accuracy',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should use referer as fallback for page', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([
          ['content-type', 'application/json'],
          ['referer', 'http://localhost:4321/docs/intro'],
        ]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          rating: 4,
          notes: 'Good',
          category: 'general',
        })),
      };

      mockRequest.headers.get = (key: string) => {
        if (key === 'content-type') return 'application/json';
        if (key === 'referer') return 'http://localhost:4321/docs/intro';
        return undefined;
      };

      const response = await POST({ request: mockRequest as any } as any);

      expect(response.status).toBe(200);
      expect(globalThis.__ASTRO_COAUTHOR__.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          page: '/docs/intro',
          rating: 4,
        })
      );
    });

    it('should return 400 for invalid JSON', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue('{ invalid json }'),
      };

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON payload');
    });

    it('should return 400 when page is missing', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          notes: 'Test',
        })),
      };

      mockRequest.headers.get = () => undefined;

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rating is required');
    });

    it('should return 400 when rating is missing', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          page: '/test',
          notes: 'Test',
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rating is required');
    });

    it('should return 400 when rating is invalid', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          page: '/test',
          rating: 'not-a-number',
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rating is required');
    });

    it('should handle empty body', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(''),
      };

      mockRequest.headers.get = () => undefined;

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rating is required');
    });

    it('should use default values for optional fields', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          page: '/test',
          rating: 3,
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);

      expect(response.status).toBe(200);
      expect(globalThis.__ASTRO_COAUTHOR__.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          page: '/test',
          rating: 3,
          notes: '',
          category: 'general',
        })
      );
    });

    it('should handle storage save errors', async () => {
      globalThis.__ASTRO_COAUTHOR__.storage.save = vi.fn().mockRejectedValue(
        new Error('Storage error')
      );

      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          page: '/test',
          rating: 5,
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save feedback');
    });

    it('should support legacy comment field', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          page: '/test',
          rating: 4,
          comment: 'Legacy comment field',
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);

      expect(response.status).toBe(200);
      expect(globalThis.__ASTRO_COAUTHOR__.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Legacy comment field',
        })
      );
    });

    it('should support legacy pageUrl field', async () => {
      const mockRequest = {
        url: 'http://localhost:4321/_ai-coauthor/feedback',
        headers: new Map([['content-type', 'application/json']]),
        text: vi.fn().mockResolvedValue(JSON.stringify({
          pageUrl: '/legacy-page',
          rating: 4,
        })),
      };

      const response = await POST({ request: mockRequest as any } as any);

      expect(response.status).toBe(200);
      expect(globalThis.__ASTRO_COAUTHOR__.storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          page: '/legacy-page',
        })
      );
    });
  });

  describe('GET handler', () => {
    it('should return feedback entries', async () => {
      const mockEntries = [
        { page: '/test1', rating: 5, notes: 'Great!', timestamp: 123456 },
        { page: '/test2', rating: 4, notes: 'Good', timestamp: 123457 },
      ];

      globalThis.__ASTRO_COAUTHOR__.storage.loadAll = vi.fn().mockResolvedValue(mockEntries);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe('1.0.0');
      expect(data.entries).toEqual(mockEntries);
      expect(data.lastUpdated).toBeDefined();
    });

    it('should return empty array when no entries exist', async () => {
      globalThis.__ASTRO_COAUTHOR__.storage.loadAll = vi.fn().mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entries).toEqual([]);
    });

    it('should handle storage load errors', async () => {
      globalThis.__ASTRO_COAUTHOR__.storage.loadAll = vi.fn().mockRejectedValue(
        new Error('Storage error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve feedback');
    });
  });
});
