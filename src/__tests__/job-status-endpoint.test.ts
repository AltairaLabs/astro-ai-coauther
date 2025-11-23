import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQueue = {
  getJob: vi.fn(),
  getAllJobs: vi.fn(),
};

// Mock the job queue module
vi.mock('../utils/llm/job-queue', () => ({
  getJobQueue: () => mockQueue,
}));

import { GET } from '../pages/_ai-coauthor/job-status';

describe('Job Status Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET handler', () => {
    it('should return all jobs when no jobId provided', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          status: 'completed',
          progress: { total: 1, completed: 1 },
          results: [],
          startedAt: new Date().toISOString(),
        },
      ];
      vi.mocked(mockQueue.getAllJobs).mockReturnValue(mockJobs as any);

      const url = new URL('http://localhost:3000/_ai-coauthor/job-status');

      const response = await GET({ url } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toBeDefined();
      expect(data.count).toBe(1);
    });

    it('should return 404 if job not found', async () => {
      vi.mocked(mockQueue.getJob).mockReturnValue(undefined);

      const url = new URL('http://localhost:3000/_ai-coauthor/job-status?jobId=test-123');

      const response = await GET({ url } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });

    it('should return job status for pending job', async () => {
      const mockJob = {
        id: 'test-123',
        status: 'pending' as const,
        progress: { total: 5, completed: 0 },
        results: [],
        startedAt: new Date().toISOString(),
      };
      vi.mocked(mockQueue.getJob).mockReturnValue(mockJob as any);

      const url = new URL('http://localhost:3000/_ai-coauthor/job-status?jobId=test-123');

      const response = await GET({ url } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('pending');
      expect(data.id).toBe('test-123');
    });

    it('should return job status for completed job', async () => {
      const mockJob = {
        id: 'test-123',
        status: 'completed' as const,
        progress: { total: 1, completed: 1 },
        results: [
          {
            docPath: '/test-page',
            files: ['test.ts'],
            folders: [],
            confidence: 'high',
            reasoning: ['Test reasoning'],
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      vi.mocked(mockQueue.getJob).mockReturnValue(mockJob as any);

      const url = new URL('http://localhost:3000/_ai-coauthor/job-status?jobId=test-123');

      const response = await GET({ url } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.results).toBeDefined();
      expect(data.results[0].files).toContain('test.ts');
    });

    it('should return job status for failed job', async () => {
      const mockJob = {
        id: 'test-123',
        status: 'failed' as const,
        progress: { total: 5, completed: 2 },
        results: [],
        error: 'Test error message',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      vi.mocked(mockQueue.getJob).mockReturnValue(mockJob as any);

      const url = new URL('http://localhost:3000/_ai-coauthor/job-status?jobId=test-123');

      const response = await GET({ url } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('failed');
      expect(data.error).toBe('Test error message');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(mockQueue.getJob).mockImplementation(() => {
        throw new Error('Queue error');
      });

      const url = new URL('http://localhost:3000/_ai-coauthor/job-status?jobId=test-123');

      const response = await GET({ url } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Queue error');
    });
  });
});
