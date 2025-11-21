/**
 * Tests for export API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the export utilities
vi.mock('../utils/export', () => ({
  exportFeedback: vi.fn(),
  generateAnalytics: vi.fn(),
  generateTasks: vi.fn(),
}));

describe('Export API Endpoint', () => {
  let GET: any;
  let exportFeedback: any;
  let generateAnalytics: any;
  let generateTasks: any;
  let mockStorage: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock storage
    mockStorage = {
      loadAll: vi.fn().mockResolvedValue([
        {
          page: '/test',
          rating: 5,
          category: 'general',
          notes: 'Great!',
          timestamp: new Date().toISOString(),
        },
      ]),
    };

    // Setup global storage
    (globalThis as any).__ASTRO_COAUTHOR__ = { storage: mockStorage };
    
    // Import the endpoint handler
    const module = await import('../pages/_ai-coauthor/export');
    GET = module.GET;
    
    // Get the mocked functions
    const exportModule = await import('../utils/export');
    exportFeedback = exportModule.exportFeedback;
    generateAnalytics = exportModule.generateAnalytics;
    generateTasks = exportModule.generateTasks;
  });

  describe('GET handler', () => {
    it('should export feedback as JSON by default', async () => {
      exportFeedback.mockReturnValue('{"data":"json"}');

      const url = new URL('http://localhost/_ai-coauthor/export');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('feedback-export.json');
      
      const data = await response.text();
      expect(data).toBe('{"data":"json"}');
    });

    it('should export feedback as CSV', async () => {
      exportFeedback.mockReturnValue('page,rating\n/test,5');

      const url = new URL('http://localhost/_ai-coauthor/export?format=csv');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('feedback-export.csv');
    });

    it('should export feedback as Markdown', async () => {
      exportFeedback.mockReturnValue('# Feedback\n\nGreat docs!');

      const url = new URL('http://localhost/_ai-coauthor/export?format=markdown');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/markdown');
      expect(response.headers.get('Content-Disposition')).toContain('feedback-export.md');
    });

    it('should filter by page', async () => {
      exportFeedback.mockReturnValue('{}');

      const url = new URL('http://localhost/_ai-coauthor/export?page=/test-page');
      const context = { url };

      await GET(context);
      
      expect(exportFeedback).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ filterByPage: '/test-page' })
      );
    });

    it('should filter by category', async () => {
      exportFeedback.mockReturnValue('{}');

      const url = new URL('http://localhost/_ai-coauthor/export?category=accuracy');
      const context = { url };

      await GET(context);
      
      expect(exportFeedback).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ filterByCategory: 'accuracy' })
      );
    });

    it('should filter by rating range', async () => {
      exportFeedback.mockReturnValue('{}');

      const url = new URL('http://localhost/_ai-coauthor/export?minRating=3&maxRating=5');
      const context = { url };

      await GET(context);
      
      expect(exportFeedback).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          filterByRating: { min: 3, max: 5 }
        })
      );
    });

    it('should filter by date range', async () => {
      exportFeedback.mockReturnValue('{}');

      const url = new URL('http://localhost/_ai-coauthor/export?startDate=2025-01-01&endDate=2025-12-31');
      const context = { url };

      await GET(context);
      
      expect(exportFeedback).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          dateRange: {
            start: new Date('2025-01-01'),
            end: new Date('2025-12-31')
          }
        })
      );
    });

    it('should generate analytics', async () => {
      const mockAnalytics = {
        totalFeedback: 10,
        averageRating: 4.5,
        categoryBreakdown: {},
      };
      generateAnalytics.mockReturnValue(mockAnalytics);

      const url = new URL('http://localhost/_ai-coauthor/export?action=analytics');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(mockAnalytics);
      expect(generateAnalytics).toHaveBeenCalled();
    });

    it('should generate tasks', async () => {
      const mockTasks = [
        { page: '/test', priority: 'high', issues: ['accuracy'] }
      ];
      generateTasks.mockReturnValue(mockTasks);

      const url = new URL('http://localhost/_ai-coauthor/export?action=tasks');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.tasks).toEqual(mockTasks);
      expect(generateTasks).toHaveBeenCalled();
    });

    it('should return 400 for invalid action', async () => {
      const url = new URL('http://localhost/_ai-coauthor/export?action=invalid');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid action parameter');
    });

    it('should handle storage errors', async () => {
      mockStorage.loadAll.mockRejectedValue(new Error('Storage error'));

      const url = new URL('http://localhost/_ai-coauthor/export');
      const context = { url };

      const response = await GET(context);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Failed to export feedback');
    });
  });
});
