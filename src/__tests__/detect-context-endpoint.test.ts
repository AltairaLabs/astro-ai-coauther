/**
 * Tests for detect-context API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the source-context-detection module
vi.mock('../utils/source-context-detection', () => ({
  detectSourceContext: vi.fn(),
}));

describe('Detect Context API Endpoint', () => {
  let POST: any;
  let GET: any;
  let detectSourceContext: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Import the endpoint handlers
    const module = await import('../pages/_ai-coauthor/detect-context');
    POST = module.POST;
    GET = module.GET;
    
    // Get the mocked function
    const detection = await import('../utils/source-context-detection');
    detectSourceContext = detection.detectSourceContext;
  });

  describe('POST handler', () => {
    it('should return 400 for empty body', async () => {
      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: '',
      });

      const response = await POST({ request });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Empty request body');
    });

    it('should return 400 for whitespace-only body', async () => {
      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: '   \n  \t  ',
      });

      const response = await POST({ request });
      expect(response.status).toBe(400);
    });

    it('should return 400 for missing docPath', async () => {
      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: JSON.stringify({ docContent: 'test content' }),
      });

      const response = await POST({ request });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Missing docPath or docContent');
    });

    it('should return 400 for missing docContent', async () => {
      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: JSON.stringify({ docPath: '/test' }),
      });

      const response = await POST({ request });
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Missing docPath or docContent');
    });

    it('should successfully detect source context', async () => {
      const mockResult = {
        sourceContext: {
          files: ['src/test.ts'],
          folders: [],
          confidence: 'high',
        },
        confidence: 'high',
        reasoning: ['Test match'],
      };

      detectSourceContext.mockResolvedValue(mockResult);

      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: JSON.stringify({
          docPath: '/test-page',
          docContent: 'Test documentation content',
        }),
      });

      const response = await POST({ request });
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(mockResult);
      expect(detectSourceContext).toHaveBeenCalled();
    });

    it('should handle detection errors', async () => {
      detectSourceContext.mockRejectedValue(new Error('Detection failed'));

      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: JSON.stringify({
          docPath: '/test-page',
          docContent: 'Test content',
        }),
      });

      const response = await POST({ request });
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Detection failed');
    });

    it('should handle non-Error exceptions', async () => {
      detectSourceContext.mockRejectedValue('String error');

      const request = new Request('http://localhost/_ai-coauthor/detect-context', {
        method: 'POST',
        body: JSON.stringify({
          docPath: '/test-page',
          docContent: 'Test content',
        }),
      });

      const response = await POST({ request });
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Unknown error');
    });
  });

  describe('GET handler', () => {
    it('should return API status', async () => {
      const response = await GET();
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('Source context detection API is running');
      expect(data.methods).toEqual(['POST']);
      expect(data.endpoint).toBe('/_ai-coauthor/detect-context');
    });
  });
});
